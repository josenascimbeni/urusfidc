import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAccountContext } from "@/lib/auth/context";
import { billingProfileSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await requireAccountContext(); if (context.role !== "professional") throw new ApiError(403, "Administradores não possuem cobrança de cliente."); const input = billingProfileSchema.parse(await request.json()); const admin = createAdminSupabaseClient();
    const { error } = await admin.from("billing_profiles").upsert({ account_id: context.accountId, person_type: input.personType, tax_id: input.taxId, legal_name: input.legalName, postal_code: input.postalCode, address_line1: input.addressLine1, address_line2: input.addressLine2 ?? null, city: input.city, state: input.state }, { onConflict: "account_id" });
    if (error) throw new ApiError(500, "Não foi possível salvar os dados de cobrança.");
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, account_id: context.accountId, action: "billing.profile_updated", entity_type: "billing_profile", safe_metadata: { personType: input.personType, state: input.state } });
    return NextResponse.json({ data: { complete: true } });
  } catch (error) { return apiErrorResponse(error); }
}
