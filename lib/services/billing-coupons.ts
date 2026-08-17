import "server-only";

import { ApiError } from "@/lib/api/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { stripeIsLiveMode } from "@/lib/services/stripe";

type ReservedCoupon = {
  couponId: string;
  redemptionId: string;
  stripePromotionCodeId: string;
};

type ActivatedAccessCoupon = {
  couponId: string;
  redemptionId: string;
  accessExpiresAt: string;
};

const couponErrors: Record<string, { status: number; message: string; code: string }> = {
  coupon_invalid: { status: 404, message: "Cupom não encontrado ou inativo.", code: "coupon_invalid" },
  coupon_expired: { status: 409, message: "Este cupom expirou.", code: "coupon_expired" },
  coupon_test_only: { status: 409, message: "Este cupom funciona apenas no ambiente de testes.", code: "coupon_test_only" },
  coupon_not_synchronized: { status: 503, message: "O cupom ainda não foi sincronizado com a cobrança.", code: "coupon_not_ready" },
  coupon_plan_ineligible: { status: 409, message: "Este cupom não se aplica ao plano selecionado.", code: "coupon_plan_ineligible" },
  coupon_limit_reached: { status: 409, message: "O limite de utilizações deste cupom foi atingido.", code: "coupon_limit_reached" },
  coupon_account_limit_reached: { status: 409, message: "Este cupom já foi utilizado por esta conta.", code: "coupon_account_limit_reached" },
  coupon_not_access_grant: { status: 409, message: "Este cupom requer o fluxo normal de assinatura.", code: "coupon_not_access_grant" },
  coupon_subscription_conflict: { status: 409, message: "Esta conta já possui uma assinatura vinculada. Gerencie a assinatura atual para continuar.", code: "coupon_subscription_conflict" },
};

function couponApiError(error: { message: string }) {
  const matched = Object.entries(couponErrors).find(([key]) => error.message.includes(key));
  if (!matched) return null;
  const [, detail] = matched;
  return new ApiError(detail.status, detail.message, detail.code);
}

export async function couponBypassesPayment(code: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.from("billing_coupons").select("payment_bypass").eq("code", code).maybeSingle();
  if (error) throw new ApiError(500, "Não foi possível validar o cupom.", "coupon_validation_failed");
  return data?.payment_bypass === true;
}

export async function activateAccessCoupon(input: { code: string; accountId: string; subscriptionId: string }): Promise<ActivatedAccessCoupon> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("activate_access_coupon", {
    coupon_code: input.code,
    target_account_id: input.accountId,
    target_subscription_id: input.subscriptionId,
  });

  if (error) {
    const knownError = couponApiError(error);
    if (knownError) throw knownError;
    throw new ApiError(500, "Não foi possível ativar o acesso promocional.", "access_coupon_activation_failed");
  }

  const activation = Array.isArray(data) ? data[0] : data;
  if (!activation?.result_coupon_id || !activation?.result_redemption_id || !activation?.result_access_expires_at) {
    throw new ApiError(500, "Não foi possível ativar o acesso promocional.", "access_coupon_activation_failed");
  }

  return {
    couponId: String(activation.result_coupon_id),
    redemptionId: String(activation.result_redemption_id),
    accessExpiresAt: String(activation.result_access_expires_at),
  };
}

export async function reserveBillingCoupon(input: { code: string; accountId: string; subscriptionId: string }): Promise<ReservedCoupon> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("reserve_billing_coupon", {
    coupon_code: input.code,
    target_account_id: input.accountId,
    target_subscription_id: input.subscriptionId,
    stripe_livemode: stripeIsLiveMode(),
  });

  if (error) {
    const knownError = couponApiError(error);
    if (knownError) throw knownError;
    throw new ApiError(500, "Não foi possível validar o cupom.", "coupon_validation_failed");
  }

  const reservation = Array.isArray(data) ? data[0] : data;
  if (!reservation?.result_coupon_id || !reservation?.result_redemption_id || !reservation?.result_stripe_promotion_code_id) {
    throw new ApiError(500, "Não foi possível reservar o cupom.", "coupon_reservation_failed");
  }

  return {
    couponId: String(reservation.result_coupon_id),
    redemptionId: String(reservation.result_redemption_id),
    stripePromotionCodeId: String(reservation.result_stripe_promotion_code_id),
  };
}

export async function linkCouponToCheckout(redemptionId: string, checkoutSessionId: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("coupon_redemptions").update({ stripe_checkout_session_id: checkoutSessionId }).eq("id", redemptionId).eq("status", "reserved");
  if (error) throw new ApiError(500, "Não foi possível vincular o cupom ao checkout.", "coupon_link_failed");
}

export async function cancelCouponReservation(redemptionId: string) {
  const admin = createAdminSupabaseClient();
  await admin.from("coupon_redemptions").update({ status: "cancelled" }).eq("id", redemptionId).eq("status", "reserved");
}
