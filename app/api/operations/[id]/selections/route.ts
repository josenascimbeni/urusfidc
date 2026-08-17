import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireActiveSubscription } from "@/lib/auth/context";
import { manualSelectionSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const account = await requireActiveSubscription();
    const input = manualSelectionSchema.parse(await request.json());
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const [{ data: operation }, { data: match }] = await Promise.all([
      supabase.from("operations").select("id").eq("id", id).maybeSingle(),
      supabase.from("match_results").select("eligible").eq("operation_id", id).eq("fidc_id", input.fidcId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    if (!operation || !match) throw new ApiError(404, "Operação ou resultado não encontrado.", "not_found");
    if (match.eligible) throw new ApiError(409, "Este FIDC já foi sugerido automaticamente.", "already_suggested");
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.from("fidc_selections").upsert({ account_id: account.accountId, operation_id: id, fidc_id: input.fidcId, origin: "manual_request", decision: "requested", reason: input.reason, requested_by: account.user.id, requested_at: new Date().toISOString(), decided_by: null, decided_at: null }, { onConflict: "operation_id,fidc_id" }).select("id,decision").single();
    if (error || !data) throw new ApiError(500, "Não foi possível enviar a solicitação.");
    await Promise.all([
      admin.from("audit_logs").insert({ actor_user_id: account.user.id, account_id: account.accountId, action: "fidc.exception_requested", entity_type: "operation", entity_id: id, safe_metadata: { fidcId: input.fidcId } }),
      admin.from("notification_outbox").insert({ account_id: account.accountId, operation_id: id, audience: "urus", template_key: "manual_match_requested", safe_payload: { selectionId: data.id }, dedupe_key: `manual-match:${id}:${input.fidcId}` }),
    ]);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
