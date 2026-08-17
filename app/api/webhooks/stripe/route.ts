import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { requireServerEnv } from "@/lib/config/env";
import { stripe } from "@/lib/services/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const allowedStatuses = new Set(["incomplete", "active", "past_due", "unpaid", "canceled"]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, requireServerEnv("STRIPE_WEBHOOK_SECRET"));
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }
  const admin = createAdminSupabaseClient();
  const eventObject = event.data.object as { id?: string; object?: string; status?: string; customer?: string | { id?: string } | null };
  const { error: eventError } = await admin.from("stripe_events").insert({ event_id: event.id, event_type: event.type, livemode: event.livemode, payload: { objectId: eventObject.id, objectType: eventObject.object, status: eventObject.status, customerId: typeof eventObject.customer === "string" ? eventObject.customer : eventObject.customer?.id } });
  if (eventError?.code === "23505") {
    const { data: existing } = await admin.from("stripe_events").select("status").eq("event_id", event.id).single();
    if (existing?.status === "processed") return NextResponse.json({ received: true, duplicate: true });
    await admin.from("stripe_events").update({ status: "processing", error_code: null }).eq("event_id", event.id);
  }
  if (eventError && eventError.code !== "23505") return NextResponse.json({ error: "event_store_failed" }, { status: 500 });

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const accountId = session.client_reference_id;
    if (accountId) await admin.from("subscriptions").update({ stripe_customer_id: String(session.customer), stripe_subscription_id: String(session.subscription), access_source: "stripe" }).eq("account_id", accountId);
    const redemptionId = session.metadata?.coupon_redemption_id;
    if (redemptionId) {
      const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
      await admin.from("coupon_redemptions").update({ status: "applied", applied_at: new Date().toISOString(), stripe_subscription_id: stripeSubscriptionId ?? null }).eq("id", redemptionId).eq("stripe_checkout_session_id", session.id).eq("status", "reserved");
    }
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await admin.from("coupon_redemptions").update({ status: "expired" }).eq("stripe_checkout_session_id", session.id).eq("status", "reserved");
  }
  if (event.type.startsWith("customer.subscription.")) {
    const subscription = event.data.object as Stripe.Subscription;
    const status = subscription.status === "canceled" ? "cancelled" : subscription.status;
    if (allowedStatuses.has(subscription.status)) {
      const periodEnd = Math.max(...subscription.items.data.map((item) => item.current_period_end)); const periodStart = Math.min(...subscription.items.data.map((item) => item.current_period_start));
      const cycleStart = Number.isFinite(periodStart) ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(); const cycleEnd = Number.isFinite(periodEnd) ? new Date(periodEnd * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await admin.from("subscriptions").update({ status, access_source: "stripe", stripe_subscription_id: subscription.id, cycle_start: cycleStart, cycle_end: cycleEnd, current_period_end: cycleEnd }).eq("stripe_customer_id", String(subscription.customer)).select("id,account_id,plan_version_id").maybeSingle();
      if (data?.account_id) {
        await admin.from("customer_accounts").update({ status: subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : subscription.status === "canceled" ? "cancelled" : "pending_subscription" }).eq("id", data.account_id);
        const { data: plan } = await admin.from("plan_versions").select("monthly_case_limit").eq("id", data.plan_version_id).single();
        await admin.from("usage_periods").upsert({ account_id: data.account_id, subscription_id: data.id, cycle_start: cycleStart, cycle_end: cycleEnd, case_limit: plan?.monthly_case_limit ?? 100 }, { onConflict: "subscription_id,cycle_start", ignoreDuplicates: true });
      }
    }
  }
  await admin.from("stripe_events").update({ status: "processed", processed_at: new Date().toISOString() }).eq("event_id", event.id);
  return NextResponse.json({ received: true });
}
