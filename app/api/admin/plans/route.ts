import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { planVersionSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try { const context = await requireAdmin({ mfa: true }); const input = planVersionSchema.parse(await request.json()); const admin = createAdminSupabaseClient(); const { data: latest } = await admin.from("plan_versions").select("version").eq("name", input.name).order("version", { ascending: false }).limit(1).maybeSingle(); const version = (latest?.version ?? 0) + 1; await admin.from("plan_versions").update({ status: "archived" }).eq("name", input.name).eq("status", "active"); const { data, error } = await admin.from("plan_versions").insert({ name: input.name, version, price_cents: input.priceCents, monthly_case_limit: input.monthlyCaseLimit, stripe_price_id: input.stripePriceId, status: "active" }).select("*").single(); if (error || !data) throw new ApiError(500, "Não foi possível criar a versão do plano."); await admin.from("audit_logs").insert({ actor_user_id: context.user.id, action: "plan.version_created", entity_type: "plan_version", entity_id: data.id, safe_metadata: { name: input.name, version, priceCents: input.priceCents, monthlyCaseLimit: input.monthlyCaseLimit } }); return NextResponse.json({ data }, { status: 201 }); } catch (error) { return apiErrorResponse(error); }
}
