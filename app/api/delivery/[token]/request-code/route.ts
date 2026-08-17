import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { hashDeliveryToken, hashOtp, parseDeliveryToken } from "@/lib/security/delivery-tokens";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { resend } from "@/lib/services/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params; const parsed = parseDeliveryToken(token);
    if (!parsed) throw new ApiError(404, "Este acesso expirou ou não é válido.", "invalid_delivery");
    await enforceRateLimit(request, `delivery-code:${parsed.deliveryId}`, 3, 600);
    const admin = createAdminSupabaseClient();
    const { data: delivery } = await admin.from("secure_deliveries").select("id,recipient_email,failed_attempts,status").eq("id", parsed.deliveryId).eq("link_token_hash", hashDeliveryToken(token)).maybeSingle();
    if (!delivery || ["expired", "revoked"].includes(delivery.status)) throw new ApiError(404, "Este acesso não está mais disponível.", "invalid_delivery");
    if (delivery.failed_attempts >= 5) throw new ApiError(429, "Muitas tentativas. Solicite um novo acesso à Urus.", "delivery_locked");
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await admin.from("secure_deliveries").update({ otp_hash: hashOtp(delivery.id, code), otp_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() }).eq("id", delivery.id);
    await resend().emails.send({ from: process.env.RESEND_FROM_EMAIL ?? "Urus FIDC <notificacoes@example.com>", to: delivery.recipient_email, subject: "Código de acesso — Urus FIDC", text: `Seu código de acesso é ${code}. Ele expira em 10 minutos. Não compartilhe este código.` });
    await admin.from("delivery_access_attempts").insert({ delivery_id: delivery.id, outcome: "otp_sent" });
    return NextResponse.json({ data: { sent: true, recipientHint: delivery.recipient_email.replace(/(^.).*(@.*$)/, "$1••••$2") } });
  } catch (error) { return apiErrorResponse(error); }
}
