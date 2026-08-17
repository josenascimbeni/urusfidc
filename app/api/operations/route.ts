import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAccountContext, requireActiveSubscription } from "@/lib/auth/context";
import { operationInputSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    await requireAccountContext();
    const supabase = await createServerSupabaseClient();
    const cursor = new URL(request.url).searchParams.get("cursor");
    let query = supabase.from("operations").select("id,public_code,status,amount_cents,operation_type,has_guarantee,created_at,company:companies(id,legal_name,cnpj,segment,annual_revenue_cents,city,state)").order("created_at", { ascending: false }).limit(25);
    if (cursor) query = query.lt("created_at", cursor);
    const { data, error } = await query;
    if (error) throw new ApiError(500, "Não foi possível carregar as operações.");
    return NextResponse.json({ data, nextCursor: data?.at(-1)?.created_at ?? null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveSubscription();
    const input = operationInputSchema.parse(await request.json());
    const admin = createAdminSupabaseClient();

    const { data: company, error: companyError } = await admin.from("companies").upsert({
      account_id: context.accountId,
      cnpj: input.cnpj,
      legal_name: input.companyName,
      segment: input.segment,
      annual_revenue_cents: input.annualRevenueCents,
      city: input.city,
      state: input.state,
    }, { onConflict: "account_id,cnpj" }).select("id").single();
    if (companyError || !company) throw new ApiError(500, "Não foi possível salvar os dados da empresa.");

    const { data: operation, error: operationError } = await admin.from("operations").insert({
      account_id: context.accountId,
      company_id: company.id,
      amount_cents: input.amountCents,
      operation_type: input.operationType,
      has_guarantee: input.hasGuarantee,
      guarantee_value_cents: input.hasGuarantee ? input.guaranteeValueCents : 0,
      guarantee_type: input.hasGuarantee ? input.guaranteeType : null,
      sales_method: input.salesMethod,
      receipt_method: input.receiptMethod,
    }).select("id,public_code,status,created_at").single();
    if (operationError || !operation) throw new ApiError(500, "Não foi possível criar a operação.");

    await admin.from("operation_events").insert({ account_id: context.accountId, operation_id: operation.id, event_type: "operation_created", actor_user_id: context.user.id, summary: "Operação cadastrada pelo profissional." });

    const { data: duplicates } = await admin.from("companies").select("account_id").eq("cnpj", input.cnpj).neq("account_id", context.accountId).limit(3);
    if (duplicates?.length) {
      const cnpjHash = createHash("sha256").update(input.cnpj).digest("hex");
      await admin.from("duplicate_company_alerts").insert(duplicates.map((item) => ({ cnpj_hash: cnpjHash, first_account_id: item.account_id, second_account_id: context.accountId })));
    }
    return NextResponse.json({ data: operation }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
