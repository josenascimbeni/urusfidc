import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { billingCouponInputSchema } from "@/lib/domain/schemas";
import { stripe, stripeIsLiveMode } from "@/lib/services/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true });
    const input = billingCouponInputSchema.parse(await request.json());
    const admin = createAdminSupabaseClient();
    const { data: existing } = await admin.from("billing_coupons").select("id,stripe_coupon_id,stripe_promotion_code_id").eq("code", input.code).maybeSingle();
    if (existing?.stripe_promotion_code_id) throw new ApiError(409, "Já existe um cupom com este código.", "coupon_code_exists");

    const coupon = await stripe().coupons.create({
      name: input.name,
      percent_off: input.percentOff,
      duration: input.duration,
      duration_in_months: input.duration === "repeating" ? input.durationMonths ?? undefined : undefined,
      max_redemptions: input.maxRedemptions ?? undefined,
      redeem_by: input.redeemBy ? Math.floor(new Date(input.redeemBy).getTime() / 1000) : undefined,
      metadata: { urus_code: input.code },
    }, { idempotencyKey: `urus-coupon-${input.code}` });

    const promotionCode = await stripe().promotionCodes.create({
      coupon: coupon.id,
      code: input.code,
      active: true,
      max_redemptions: input.maxRedemptions ?? undefined,
      expires_at: input.redeemBy ? Math.floor(new Date(input.redeemBy).getTime() / 1000) : undefined,
      metadata: { urus_code: input.code },
    }, { idempotencyKey: `urus-promotion-${input.code}` });

    const values = {
      code: input.code,
      name: input.name,
      discount_type: "percent",
      percent_off: input.percentOff,
      duration: input.duration,
      duration_months: input.duration === "repeating" ? input.durationMonths : null,
      max_redemptions: input.maxRedemptions ?? null,
      per_account_limit: input.perAccountLimit,
      redeem_by: input.redeemBy ?? null,
      active: true,
      test_only: stripeIsLiveMode() ? input.testOnly : true,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promotionCode.id,
      created_by: context.user.id,
    };

    const result = existing
      ? await admin.from("billing_coupons").update(values).eq("id", existing.id).select("*").single()
      : await admin.from("billing_coupons").insert(values).select("*").single();

    if (result.error || !result.data) {
      await stripe().promotionCodes.update(promotionCode.id, { active: false });
      await stripe().coupons.del(coupon.id);
      throw new ApiError(500, "Não foi possível salvar o cupom.", "coupon_store_failed");
    }

    await admin.from("audit_logs").insert({
      actor_user_id: context.user.id,
      action: "billing.coupon_created",
      entity_type: "billing_coupon",
      entity_id: result.data.id,
      safe_metadata: { code: input.code, percentOff: input.percentOff, duration: input.duration, testOnly: values.test_only },
    });
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
