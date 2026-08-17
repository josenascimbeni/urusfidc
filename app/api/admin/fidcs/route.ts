import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { fidcInputSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

export async function GET() {
  try { await requireAdmin({ mfa: true }); const admin = createAdminSupabaseClient(); const [{ data: fidcs, error }, { data: templates }] = await Promise.all([admin.from("fidcs").select("*").order("name"), admin.from("checklist_templates").select("id,name,fidc_id,scope,active_version").eq("status", "active").order("name")]); if (error) throw new ApiError(500, "Não foi possível carregar os FIDCs."); return NextResponse.json({ data: { fidcs, templates } }); } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true }); const input = fidcInputSchema.parse(await request.json()); const admin = createAdminSupabaseClient();
    const { data: fidc, error } = await admin.from("fidcs").insert({ slug: slugify(input.name), name: input.name, distribution_email: input.distributionEmail, status: input.status, min_revenue_cents: input.minRevenueCents, max_revenue_cents: input.maxRevenueCents ?? null, revenue_mode: input.revenueMode, revenue_required: input.revenueRequired, segments: input.segments, operation_types: input.operationTypes, regions: input.regions, weights: input.weights }).select("id,name").single();
    if (error?.code === "23505") throw new ApiError(409, "Já existe um FIDC com este nome.", "duplicate_fidc");
    if (error || !fidc) throw new ApiError(500, "Não foi possível cadastrar o FIDC.");
    const { data: template, error: templateError } = await admin.from("checklist_templates").insert({ fidc_id: fidc.id, name: `Checklist adicional — ${fidc.name}`, scope: "fidc_additional", active_version: 1 }).select("id").single();
    if (templateError || !template) { await admin.from("fidcs").delete().eq("id", fidc.id); throw new ApiError(500, "Não foi possível criar o checklist do FIDC."); }
    const { data: version } = await admin.from("checklist_versions").insert({ template_id: template.id, version: 1, created_by: context.user.id }).select("id").single();
    if (version && input.sourceChecklistTemplateId) {
      const { data: source } = await admin.from("checklist_templates").select("active_version").eq("id", input.sourceChecklistTemplateId).single();
      const { data: sourceVersion } = source ? await admin.from("checklist_versions").select("id").eq("template_id", input.sourceChecklistTemplateId).eq("version", source.active_version).single() : { data: null };
      const { data: items } = sourceVersion ? await admin.from("checklist_items").select("stable_key,name,detail,instructions,required,multiplicity,validity_days,allowed_mime_types,max_size_mb,expected_evidence,ai_standard,active,sort_order").eq("version_id", sourceVersion.id).eq("active", true) : { data: [] };
      if (items?.length) await admin.from("checklist_items").insert(items.map((item) => ({ ...item, version_id: version.id })));
    }
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, action: "fidc.created", entity_type: "fidc", entity_id: fidc.id, safe_metadata: { name: fidc.name, status: input.status } });
    return NextResponse.json({ data: fidc }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
