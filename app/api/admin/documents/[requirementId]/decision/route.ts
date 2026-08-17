import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { humanDocumentDecisionSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request, context: { params: Promise<{ requirementId: string }> }) {
  try {
    const adminContext = await requireAdmin({ mfa: true });
    const input = humanDocumentDecisionSchema.parse(await request.json());
    const { requirementId } = await context.params;
    const admin = createAdminSupabaseClient();
    const { data: requirement } = await admin.from("checklist_requirements").select("id,account_id,operation_id,fidc_id,status").eq("id", requirementId).maybeSingle();
    if (!requirement) throw new ApiError(404, "Requisito não encontrado.", "not_found");
    const { data: review } = await admin.from("ai_reviews").select("id,status").eq("requirement_id", requirementId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!review || review.status !== "completed") throw new ApiError(409, "A análise prévia da IA precisa estar concluída.", "ai_review_pending");
    const { error } = await admin.from("human_document_decisions").insert({ account_id: requirement.account_id, requirement_id: requirementId, ai_review_id: review.id, decision: input.decision, reason: input.reason ?? null, decided_by: adminContext.user.id });
    if (error) throw new ApiError(500, "Não foi possível registrar a decisão humana.");
    await admin.from("checklist_requirements").update({ status: input.decision }).eq("id", requirementId);
    await Promise.all([
      admin.from("audit_logs").insert({ actor_user_id: adminContext.user.id, account_id: requirement.account_id, action: `document.${input.decision}`, entity_type: "checklist_requirement", entity_id: requirementId, safe_metadata: { fidcId: requirement.fidc_id } }),
      admin.from("notification_outbox").insert({ account_id: requirement.account_id, operation_id: requirement.operation_id, audience: "professional", template_key: `document_${input.decision}`, safe_payload: { requirementId }, dedupe_key: `document-decision:${requirementId}:${input.decision}` }),
    ]);
    return NextResponse.json({ data: { requirementId, status: input.decision } });
  } catch (error) { return apiErrorResponse(error); }
}
