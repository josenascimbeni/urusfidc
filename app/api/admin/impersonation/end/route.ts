import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true });
    const { sessionId } = z.object({ sessionId: z.uuid() }).parse(await request.json());
    const admin = createAdminSupabaseClient();
    const { data } = await admin.from("impersonation_sessions").update({ ended_at: new Date().toISOString() }).eq("id", sessionId).eq("admin_user_id", context.user.id).is("ended_at", null).select("target_account_id").maybeSingle();
    if (!data) throw new ApiError(404, "Sessão de visualização não encontrada.", "not_found");
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, account_id: data.target_account_id, action: "impersonation.ended", entity_type: "impersonation_session", entity_id: sessionId });
    (await cookies()).delete("urus_impersonation");
    return NextResponse.json({ data: { ended: true } });
  } catch (error) { return apiErrorResponse(error); }
}
