import { createHash } from "node:crypto";
import { z } from "zod";
import { NextResponse } from "next/server";
import { ApiError, apiErrorResponse } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { billingCouponDurationSchema } from "@/lib/domain/schemas";
import { stripe } from "@/lib/services/stripe";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const statusSchema = z.object({ active: z.boolean() });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAdmin({ mfa: true });
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new ApiError(400, "Cupom inválido.");
    const input = statusSchema.parse(await request.json());
    const admin = createAdminSupabaseClient();
    const { data: coupon } = await admin.from("billing_coupons").select("id,code,active,stripe_promotion_code_id").eq("id", id).maybeSingle();
    if (!coupon) throw new ApiError(404, "Cupom não encontrado.");
    if (!coupon.stripe_promotion_code_id) throw new ApiError(409, "Sincronize o cupom com o Stripe antes de alterar o status.");

    await stripe().promotionCodes.update(coupon.stripe_promotion_code_id, { active: input.active });
    const { data, error } = await admin.from("billing_coupons").update({ active: input.active }).eq("id", id).select("*").single();
    if (error || !data) throw new ApiError(500, "Não foi possível atualizar o cupom.");
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, action: input.active ? "billing.coupon_activated" : "billing.coupon_deactivated", entity_type: "billing_coupon", entity_id: id, safe_metadata: { code: coupon.code } });
    return NextResponse.json({ data });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let replacementPromotionCodeId: string | null = null;
  let previousPromotionCodeId: string | null = null;
  let previousPromotionWasActive = false;

  try {
    const context = await requireAdmin({ mfa: true });
    const { id } = await params;
    if (!z.uuid().safeParse(id).success) throw new ApiError(400, "Cupom inválido.");
    const input = billingCouponDurationSchema.parse(await request.json());
    const admin = createAdminSupabaseClient();
    const { data: coupon } = await admin.from("billing_coupons").select("id,code,name,percent_off,duration,duration_months,max_redemptions,per_account_limit,redeem_by,active,test_only,stripe_coupon_id,stripe_promotion_code_id,updated_at").eq("id", id).maybeSingle();
    if (!coupon) throw new ApiError(404, "Cupom não encontrado.");
    if (!coupon.stripe_coupon_id || !coupon.stripe_promotion_code_id) throw new ApiError(409, "Sincronize o cupom com o Stripe antes de alterar a duração.", "coupon_not_ready");

    const durationMonths = input.duration === "repeating" ? input.durationMonths ?? null : null;
    if (coupon.duration === input.duration && coupon.duration_months === durationMonths) {
      return NextResponse.json({ data: coupon });
    }

    const { count: reservedCount, error: reservedError } = await admin.from("coupon_redemptions").select("id", { count: "exact", head: true }).eq("coupon_id", id).eq("status", "reserved").gt("reserved_until", new Date().toISOString());
    if (reservedError) throw new ApiError(500, "Não foi possível verificar os usos pendentes do cupom.", "coupon_reservations_check_failed");
    if (reservedCount) throw new ApiError(409, "Há um checkout em andamento com este cupom. Aguarde até 30 minutos antes de alterar a duração.", "coupon_has_active_reservation");

    const revisionKey = createHash("sha256").update(JSON.stringify({ id, updatedAt: coupon.updated_at, duration: input.duration, durationMonths })).digest("hex").slice(0, 24);
    const redeemBy = coupon.redeem_by && new Date(coupon.redeem_by).getTime() > Date.now() ? Math.floor(new Date(coupon.redeem_by).getTime() / 1000) : undefined;
    const replacementName = coupon.code === "URUS100TESTE"
      ? input.duration === "once"
        ? "Urus 100 — 100% na 1ª mensalidade"
        : input.duration === "repeating"
          ? `Urus 100 — 100% por ${durationMonths} meses`
          : "Urus 100 — 100% durante a assinatura"
      : coupon.name;
    const replacementCoupon = await stripe().coupons.create({
      name: String(replacementName).slice(0, 40),
      percent_off: Number(coupon.percent_off),
      duration: input.duration,
      duration_in_months: input.duration === "repeating" ? durationMonths ?? undefined : undefined,
      max_redemptions: coupon.max_redemptions ?? undefined,
      redeem_by: redeemBy,
      metadata: { urus_code: coupon.code, replaces_coupon: coupon.stripe_coupon_id, revision: revisionKey },
    }, { idempotencyKey: `urus-coupon-duration-${revisionKey}` });

    previousPromotionCodeId = coupon.stripe_promotion_code_id;
    previousPromotionWasActive = coupon.active;
    if (previousPromotionWasActive) await stripe().promotionCodes.update(coupon.stripe_promotion_code_id, { active: false });

    const replacementPromotion = await stripe().promotionCodes.create({
      coupon: replacementCoupon.id,
      code: coupon.code,
      active: coupon.active,
      max_redemptions: coupon.max_redemptions ?? undefined,
      expires_at: redeemBy,
      metadata: { urus_code: coupon.code, revision: revisionKey },
    }, { idempotencyKey: `urus-promotion-duration-${revisionKey}` });
    replacementPromotionCodeId = replacementPromotion.id;
    if (coupon.active && !replacementPromotion.active) await stripe().promotionCodes.update(replacementPromotion.id, { active: true });

    const { data, error } = await admin.from("billing_coupons").update({
      name: replacementName,
      duration: input.duration,
      duration_months: durationMonths,
      stripe_coupon_id: replacementCoupon.id,
      stripe_promotion_code_id: replacementPromotion.id,
    }).eq("id", id).select("*").single();
    if (error || !data) throw new ApiError(500, "Não foi possível salvar a nova duração do cupom.", "coupon_duration_store_failed");

    await admin.from("audit_logs").insert({
      actor_user_id: context.user.id,
      action: "billing.coupon_duration_updated",
      entity_type: "billing_coupon",
      entity_id: id,
      safe_metadata: { code: coupon.code, previousDuration: coupon.duration, duration: input.duration, durationMonths },
    });
    return NextResponse.json({ data });
  } catch (error) {
    if (replacementPromotionCodeId) await stripe().promotionCodes.update(replacementPromotionCodeId, { active: false }).catch(() => undefined);
    if (previousPromotionCodeId && previousPromotionWasActive) await stripe().promotionCodes.update(previousPromotionCodeId, { active: true }).catch(() => undefined);
    return apiErrorResponse(error);
  }
}
