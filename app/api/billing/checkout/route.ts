import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAccountContext } from "@/lib/auth/context";
import { appUrl } from "@/lib/config/env";
import { resolveStripePriceId } from "@/lib/domain/billing";
import { checkoutInputSchema } from "@/lib/domain/schemas";
import { activateAccessCoupon, cancelCouponReservation, couponBypassesPayment, linkCouponToCheckout, reserveBillingCoupon } from "@/lib/services/billing-coupons";
import { stripe } from "@/lib/services/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const input = checkoutInputSchema.parse(rawBody ? JSON.parse(rawBody) : {});
    const context = await requireAccountContext();
    if (context.role !== "professional") throw new ApiError(403, "Administradores não possuem assinatura de cliente.");
    const admin = createAdminSupabaseClient();
    const [{ data: subscription }, { data: billingProfile }] = await Promise.all([admin.from("subscriptions").select("id,stripe_customer_id,status,plan:plan_versions(stripe_price_id)").eq("account_id", context.accountId).single(), admin.from("billing_profiles").select("id").eq("account_id", context.accountId).maybeSingle()]);
    if (!subscription) throw new ApiError(404, "Assinatura não encontrada.");
    const paymentBypass = input.couponCode ? await couponBypassesPayment(input.couponCode) : false;
    if (paymentBypass) {
      const activation = await activateAccessCoupon({ code: input.couponCode, accountId: context.accountId, subscriptionId: subscription.id });
      return NextResponse.json({ data: { activated: true, redirectUrl: "/portal?acesso=ativado", accessExpiresAt: activation.accessExpiresAt } });
    }
    if (!billingProfile) throw new ApiError(409, "Complete os dados de cobrança antes de assinar.", "billing_profile_required");
    let customerId = subscription.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe().customers.create({ email: context.user.email, name: String(context.user.user_metadata.full_name ?? ""), metadata: { account_id: context.accountId } }, { idempotencyKey: `customer-${context.accountId}` });
      customerId = customer.id;
      await admin.from("subscriptions").update({ stripe_customer_id: customerId }).eq("id", subscription.id);
    }
    const plan = Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan;
    const stripePriceId = resolveStripePriceId(plan?.stripe_price_id, process.env.STRIPE_URUS_100_PRICE_ID);
    if (!stripePriceId) {
      throw new ApiError(503, "A assinatura está temporariamente indisponível. A equipe Urus já pode revisar a configuração do plano.", "billing_price_not_configured");
    }
    const reservedCoupon = input.couponCode ? await reserveBillingCoupon({ code: input.couponCode, accountId: context.accountId, subscriptionId: subscription.id }) : null;
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      success_url: `${appUrl()}/portal?assinatura=confirmada&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl()}/portal?assinatura=cancelada`,
      client_reference_id: context.accountId,
      metadata: reservedCoupon ? { coupon_redemption_id: reservedCoupon.redemptionId } : undefined,
      subscription_data: { metadata: { account_id: context.accountId, ...(reservedCoupon ? { coupon_redemption_id: reservedCoupon.redemptionId } : {}) } },
      discounts: reservedCoupon ? [{ promotion_code: reservedCoupon.stripePromotionCodeId }] : undefined,
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      customer_update: { name: "auto", address: "auto" },
    };
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe().checkout.sessions.create(sessionParams, { idempotencyKey: `checkout-v2-${context.accountId}-${subscription.status}-${reservedCoupon?.couponId ?? "sem-cupom"}` });
    } catch (error) {
      if (reservedCoupon) await cancelCouponReservation(reservedCoupon.redemptionId);
      throw error;
    }
    if (reservedCoupon) await linkCouponToCheckout(reservedCoupon.redemptionId, session.id);
    if (!session.url) throw new ApiError(500, "O checkout não retornou um endereço válido.");
    return NextResponse.json({ data: { url: session.url, value: session.amount_total === null ? undefined : session.amount_total / 100, currency: session.currency?.toUpperCase() } });
  } catch (error) {
    console.error("[billing.checkout] failed", {
      errorType: error instanceof Error ? error.name : "unknown",
      errorCode: error instanceof ApiError ? error.code : "internal_error",
      status: error instanceof ApiError ? error.status : 500,
    });
    return apiErrorResponse(error);
  }
}
