import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { impersonationInputSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true });
    const input = impersonationInputSchema.parse(await request.json());
    const admin = createAdminSupabaseClient();
    const { data: target } = await admin.from("customer_accounts").select("id,status").eq("id", input.targetAccountId).neq("status", "platform").maybeSingle();
    if (!target) throw new ApiError(404, "Profissional não encontrado.", "not_found");
    const requestHeaders = await headers();
    const contextHash = createHash("sha256").update(`${requestHeaders.get("user-agent") ?? ""}|${requestHeaders.get("x-forwarded-for") ?? ""}`).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const { data: session, error } = await admin.from("impersonation_sessions").insert({ admin_user_id: context.user.id, target_account_id: input.targetAccountId, reason: input.reason, expires_at: expiresAt, context_hash: contextHash }).select("id").single();
    if (error || !session) throw new ApiError(500, "Não foi possível iniciar a visualização.");
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, account_id: input.targetAccountId, action: "impersonation.started", entity_type: "impersonation_session", entity_id: session.id, safe_metadata: { reason: input.reason } });
    (await cookies()).set("urus_impersonation", session.id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 30 * 60, path: "/admin/impersonar" });
    return NextResponse.json({ data: { url: `/admin/impersonar/${session.id}` } });
  } catch (error) { return apiErrorResponse(error); }
}
