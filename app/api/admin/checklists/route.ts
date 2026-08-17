import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { checklistItemArchiveSchema, checklistItemInputSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const itemColumns = "stable_key,name,detail,instructions,required,multiplicity,validity_days,allowed_mime_types,max_size_mb,expected_evidence,ai_standard,active,sort_order";

function stableKey(name: string) {
  return `${name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}_${randomUUID().slice(0, 8)}`;
}

async function loadTemplate(templateId: string) {
  const admin = createAdminSupabaseClient();
  const { data: template } = await admin.from("checklist_templates").select("id,name,scope,fidc_id,active_version,status").eq("id", templateId).maybeSingle();
  if (!template || template.status !== "active") throw new ApiError(404, "Checklist não encontrado.", "not_found");
  const { data: version } = await admin.from("checklist_versions").select("id,version").eq("template_id", template.id).eq("version", template.active_version).maybeSingle();
  if (!version) throw new ApiError(409, "O checklist não possui uma versão ativa.", "version_missing");
  const { data: items, error } = await admin.from("checklist_items").select(itemColumns).eq("version_id", version.id).order("sort_order");
  if (error) throw new ApiError(500, "Não foi possível carregar os itens.");
  return { admin, template, version, items: items ?? [] };
}

async function createVersion(templateId: string, userId: string, transform: (items: Array<Record<string, unknown>>) => Array<Record<string, unknown>>) {
  const { admin, template, items } = await loadTemplate(templateId);
  const nextVersion = template.active_version + 1;
  const { data: version, error: versionError } = await admin.from("checklist_versions").insert({ template_id: templateId, version: nextVersion, created_by: userId }).select("id").single();
  if (versionError || !version) throw new ApiError(500, "Não foi possível versionar o checklist.");
  const nextItems = transform(items).map((item) => ({ ...item, version_id: version.id }));
  if (nextItems.length) {
    const { error } = await admin.from("checklist_items").insert(nextItems);
    if (error) {
      await admin.from("checklist_versions").delete().eq("id", version.id);
      throw new ApiError(500, "Não foi possível copiar os itens do checklist.");
    }
  }
  const { error: activationError } = await admin.from("checklist_templates").update({ active_version: nextVersion }).eq("id", templateId).eq("active_version", template.active_version);
  if (activationError) throw new ApiError(409, "O checklist foi alterado por outro administrador. Atualize a página.", "version_conflict");
  return { versionId: version.id, version: nextVersion };
}

export async function GET() {
  try {
    await requireAdmin({ mfa: true });
    const admin = createAdminSupabaseClient();
    const { data: templates, error } = await admin.from("checklist_templates").select("id,name,scope,fidc_id,active_version,status,fidc:fidcs(name)").eq("status", "active").order("scope").order("name");
    if (error) throw new ApiError(500, "Não foi possível carregar os checklists.");
    const data = await Promise.all((templates ?? []).map(async (template) => {
      const { data: version } = await admin.from("checklist_versions").select("id").eq("template_id", template.id).eq("version", template.active_version).maybeSingle();
      const { data: items } = version ? await admin.from("checklist_items").select("*").eq("version_id", version.id).eq("active", true).order("sort_order") : { data: [] };
      return { ...template, items: items ?? [] };
    }));
    return NextResponse.json({ data });
  } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true });
    const input = checklistItemInputSchema.parse(await request.json());
    const result = await createVersion(input.templateId, context.user.id, (items) => [...items, {
      stable_key: stableKey(input.name), name: input.name, detail: input.detail, instructions: input.instructions,
      required: input.required, multiplicity: input.multiplicity, validity_days: input.validityDays ?? null,
      allowed_mime_types: input.allowedMimeTypes, max_size_mb: input.maxSizeMb, expected_evidence: input.expectedEvidence,
      ai_standard: input.aiStandard, active: true, sort_order: items.filter((item) => item.active).length + 1,
    }]);
    const admin = createAdminSupabaseClient();
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, action: "checklist.item_added", entity_type: "checklist_template", entity_id: input.templateId, safe_metadata: { required: input.required, version: result.version } });
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}

export async function DELETE(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true });
    const input = checklistItemArchiveSchema.parse(await request.json());
    const current = await loadTemplate(input.templateId);
    if (!current.items.some((item) => item.stable_key === input.stableKey && item.active)) throw new ApiError(404, "Item não encontrado.", "not_found");
    const result = await createVersion(input.templateId, context.user.id, (items) => items.map((item) => {
      if (item.stable_key === input.stableKey && item.active) return { ...item, active: false };
      return item;
    }));
    const admin = createAdminSupabaseClient();
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, action: "checklist.item_archived", entity_type: "checklist_template", entity_id: input.templateId, safe_metadata: { stableKey: input.stableKey, version: result.version } });
    return NextResponse.json({ data: result });
  } catch (error) { return apiErrorResponse(error); }
}
