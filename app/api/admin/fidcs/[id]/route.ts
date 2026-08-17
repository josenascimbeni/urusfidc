import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { fidcInputSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const adminContext = await requireAdmin({ mfa: true }); const input = fidcInputSchema.omit({ sourceChecklistTemplateId: true }).partial().parse(await request.json()); const { id } = await context.params; const admin = createAdminSupabaseClient(); const changes: Record<string, unknown> = {}; const map: Record<string, string> = { distributionEmail: "distribution_email", minRevenueCents: "min_revenue_cents", maxRevenueCents: "max_revenue_cents", revenueMode: "revenue_mode", revenueRequired: "revenue_required", operationTypes: "operation_types" }; Object.entries(input).forEach(([key, value]) => { changes[map[key] ?? key] = value; }); const { data, error } = await admin.from("fidcs").update(changes).eq("id", id).select("id,name,status").maybeSingle(); if (error || !data) throw new ApiError(404, "FIDC não encontrado.", "not_found"); await admin.from("audit_logs").insert({ actor_user_id: adminContext.user.id, action: "fidc.updated", entity_type: "fidc", entity_id: id, safe_metadata: { fields: Object.keys(changes) } }); return NextResponse.json({ data }); } catch (error) { return apiErrorResponse(error); }
}
