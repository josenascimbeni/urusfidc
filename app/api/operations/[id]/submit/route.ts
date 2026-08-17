import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireActiveSubscription } from "@/lib/auth/context";
import { calculateServerMatches, type MatchingFidc } from "@/lib/domain/matching";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const account = await requireActiveSubscription();
    const { id } = await context.params;
    const supabase = await createServerSupabaseClient();
    const { data: operation, error } = await supabase.from("operations").select("id,operation_type,company:companies(annual_revenue_cents,segment,state)").eq("id", id).single();
    if (error || !operation) throw new ApiError(404, "Operação não encontrada.", "not_found");

    const { error: usageError } = await supabase.rpc("consume_first_matching_case", { target_operation_id: id });
    if (usageError?.message.includes("case_limit_reached")) throw new ApiError(409, "A franquia de 100 casos foi atingida.", "case_limit_reached");
    if (usageError?.message.includes("subscription_inactive")) throw new ApiError(402, "Sua assinatura precisa estar ativa.", "subscription_required");
    if (usageError) throw new ApiError(500, "Não foi possível registrar o consumo do caso.");

    const company = Array.isArray(operation.company) ? operation.company[0] : operation.company;
    if (!company) throw new ApiError(500, "Os dados da empresa estão incompletos.");
    const admin = createAdminSupabaseClient();
    const { data: fidcRows, error: fidcError } = await admin.from("fidcs").select("id,name,min_revenue_cents,max_revenue_cents,revenue_mode,revenue_required,segments,operation_types,regions,weights").eq("status", "active");
    if (fidcError) throw new ApiError(500, "Não foi possível carregar os FIDCs ativos.");

    const fidcs: MatchingFidc[] = (fidcRows ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      minRevenueCents: Number(row.min_revenue_cents),
      maxRevenueCents: row.max_revenue_cents == null ? null : Number(row.max_revenue_cents),
      revenueMode: row.revenue_mode,
      revenueRequired: row.revenue_required,
      segments: row.segments,
      operationTypes: row.operation_types,
      regions: row.regions,
      weights: row.weights as MatchingFidc["weights"],
    }));
    const matches = calculateServerMatches({ annualRevenueCents: Number(company.annual_revenue_cents), segment: company.segment, state: company.state, operationType: operation.operation_type }, fidcs);
    const { data: run, error: runError } = await admin.from("match_runs").insert({
      account_id: account.accountId,
      operation_id: id,
      input_snapshot: { annualRevenueCents: Number(company.annual_revenue_cents), segment: company.segment, state: company.state, operationType: operation.operation_type },
      rules_version: "server-v1",
    }).select("id").single();
    if (runError || !run) throw new ApiError(500, "Não foi possível registrar o matching.");
    if (matches.length) await admin.from("match_results").insert(matches.map((match) => ({
      account_id: account.accountId,
      match_run_id: run.id,
      operation_id: id,
      fidc_id: match.fidcId,
      eligible: match.eligible,
      score: match.score,
      criteria: match.criteria,
      explanation: match.explanation,
      fidc_snapshot: fidcs.find((fidc) => fidc.id === match.fidcId),
    })));
    const automatic = matches.filter((match) => match.eligible).map((match) => ({ account_id: account.accountId, operation_id: id, fidc_id: match.fidcId, origin: "automatic", decision: "suggested", requested_by: account.user.id }));
    if (automatic.length) await admin.from("fidc_selections").upsert(automatic, { onConflict: "operation_id,fidc_id", ignoreDuplicates: true });
    await admin.from("audit_logs").insert({ actor_user_id: account.user.id, account_id: account.accountId, action: "matching.submitted", entity_type: "operation", entity_id: id, safe_metadata: { matchCount: matches.length } });
    return NextResponse.json({ data: { runId: run.id, matches } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
