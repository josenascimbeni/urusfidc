import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { deliveryCodeSchema } from "@/lib/domain/schemas";
import { createDeliverySession, hashDeliveryToken, hashOtp, parseDeliveryToken } from "@/lib/security/delivery-tokens";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params; const parsed = parseDeliveryToken(token); const { code } = deliveryCodeSchema.parse(await request.json());
    if (!parsed) throw new ApiError(404, "Acesso inválido.", "invalid_delivery");
    await enforceRateLimit(request, `delivery-verify:${parsed.deliveryId}`, 8, 600);
    const admin = createAdminSupabaseClient();
    const { data: delivery } = await admin.from("secure_deliveries").select("id,otp_hash,otp_expires_at,failed_attempts").eq("id", parsed.deliveryId).eq("link_token_hash", hashDeliveryToken(token)).maybeSingle();
    if (!delivery || !delivery.otp_hash || !delivery.otp_expires_at || new Date(delivery.otp_expires_at) <= new Date()) throw new ApiError(400, "Solicite um novo código.", "otp_expired");
    if (delivery.failed_attempts >= 5) throw new ApiError(429, "Acesso bloqueado.", "delivery_locked");
    if (hashOtp(delivery.id, code) !== delivery.otp_hash) {
      await Promise.all([admin.from("secure_deliveries").update({ failed_attempts: delivery.failed_attempts + 1 }).eq("id", delivery.id), admin.from("delivery_access_attempts").insert({ delivery_id: delivery.id, outcome: "invalid_otp" })]);
      throw new ApiError(400, "Código inválido.", "invalid_otp");
    }
    const sessionExpiry = Date.now() + 30 * 60 * 1000;
    (await cookies()).set("urus_delivery", createDeliverySession(delivery.id, String(sessionExpiry)), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 30 * 60, path: `/entrega/${token}` });
    await Promise.all([admin.from("secure_deliveries").update({ status: "accessed", accessed_at: new Date().toISOString(), failed_attempts: 0, otp_hash: null, otp_expires_at: null }).eq("id", delivery.id), admin.from("delivery_access_attempts").insert({ delivery_id: delivery.id, outcome: "verified" })]);
    return NextResponse.json({ data: { verified: true } });
  } catch (error) { return apiErrorResponse(error); }
}
