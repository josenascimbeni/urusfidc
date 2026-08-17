import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { adminSelectionDecisionSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

async function activeVersion(templateId: string, versionNumber: number) {
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("checklist_versions").select("id").eq("template_id", templateId).eq("version", versionNumber).maybeSingle();
  if (!data) throw new ApiError(409, "O checklist selecionado não possui versão ativa.", "checklist_incomplete");
  return data.id;
}

async function freezeChecklist(selection: { account_id: string; operation_id: string; fidc_id: string }) {
  const admin = createAdminSupabaseClient();
  const { data: existing } = await admin.from("operation_checklists").select("id").eq("operation_id", selection.operation_id).eq("fidc_id", selection.fidc_id).maybeSingle();
  if (existing) return existing.id;
  const [{ data: standard }, { data: additional }] = await Promise.all([
    admin.from("checklist_templates").select("id,active_version").eq("scope", "urus_standard").eq("status", "active").is("fidc_id", null).single(),
    admin.from("checklist_templates").select("id,active_version").eq("scope", "fidc_additional").eq("status", "active").eq("fidc_id", selection.fidc_id).maybeSingle(),
  ]);
  if (!standard) throw new ApiError(409, "O checklist padrão Urus não está configurado.", "standard_checklist_missing");
  const standardVersionId = await activeVersion(standard.id, standard.active_version);
  const additionalVersionId = additional ? await activeVersion(additional.id, additional.active_version) : null;
  const { data: frozen, error } = await admin.from("operation_checklists").insert({ account_id: selection.account_id, operation_id: selection.operation_id, fidc_id: selection.fidc_id, standard_version_id: standardVersionId, additional_version_id: additionalVersionId }).select("id").single();
  if (error || !frozen) throw new ApiError(500, "Não foi possível congelar os checklists.");
  const versionIds = [standardVersionId, additionalVersionId].filter(Boolean) as string[];
  const { data: items } = await admin.from("checklist_items").select("*").in("version_id", versionIds).eq("active", true).order("sort_order");
  if (items?.length) {
    const { error: requirementError } = await admin.from("checklist_requirements").insert(items.map((item) => ({ account_id: selection.account_id, operation_checklist_id: frozen.id, operation_id: selection.operation_id, fidc_id: selection.fidc_id, source_item_id: item.id, item_snapshot: { stableKey: item.stable_key, name: item.name, detail: item.detail, instructions: item.instructions, required: item.required, multiplicity: item.multiplicity, validityDays: item.validity_days, allowedMimeTypes: item.allowed_mime_types, maxSizeMb: item.max_size_mb, expectedEvidence: item.expected_evidence, aiStandard: item.ai_standard }, status: "pending" })));
    if (requirementError) throw new ApiError(500, "Não foi possível gerar os requisitos documentais.");
  }
  return frozen.id;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const adminContext = await requireAdmin({ mfa: true });
    const input = adminSelectionDecisionSchema.parse(await request.json());
    const { id } = await context.params;
    const admin = createAdminSupabaseClient();
    const { data: selection } = await admin.from("fidc_selections").select("id,account_id,operation_id,fidc_id,decision").eq("id", id).maybeSingle();
    if (!selection) throw new ApiError(404, "Seleção não encontrada.", "not_found");
    if (selection.decision === "approved" && input.decision === "rejected") throw new ApiError(409, "Uma seleção já aprovada deve ser preservada no histórico.", "decision_locked");
    if (input.decision === "approved") await freezeChecklist(selection);
    const { error } = await admin.from("fidc_selections").update({ decision: input.decision, reason: input.reason ?? null, decided_by: adminContext.user.id, decided_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new ApiError(500, "Não foi possível registrar a decisão.");
    await Promise.all([
      admin.from("audit_logs").insert({ actor_user_id: adminContext.user.id, account_id: selection.account_id, action: `fidc.selection_${input.decision}`, entity_type: "fidc_selection", entity_id: id, safe_metadata: { fidcId: selection.fidc_id } }),
      admin.from("notification_outbox").insert({ account_id: selection.account_id, operation_id: selection.operation_id, audience: "professional", template_key: `fidc_selection_${input.decision}`, safe_payload: { fidcId: selection.fidc_id }, dedupe_key: `selection-decision:${id}:${input.decision}` }),
    ]);
    return NextResponse.json({ data: { id, decision: input.decision } });
  } catch (error) { return apiErrorResponse(error); }
}
