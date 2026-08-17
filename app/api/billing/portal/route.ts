import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAccountContext } from "@/lib/auth/context";
import { appUrl } from "@/lib/config/env";
import { stripe } from "@/lib/services/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST() {
  try {
    const context = await requireAccountContext();
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from("subscriptions").select("stripe_customer_id").eq("account_id", context.accountId).single();
    if (!data?.stripe_customer_id) throw new ApiError(409, "Conclua a contratação do plano antes de abrir o portal.", "customer_missing");
    const session = await stripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${appUrl()}/portal` });
    return NextResponse.json({ data: { url: session.url } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
