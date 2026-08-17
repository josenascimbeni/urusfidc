import { randomBytes, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { distributionInputSchema } from "@/lib/domain/schemas";
import { createDeliveryToken, hashDeliveryToken } from "@/lib/security/delivery-tokens";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true }); const input = distributionInputSchema.parse(await request.json()); const admin = createAdminSupabaseClient();
    const [{ data: operation }, { data: fidc }, { data: selection }, { data: checklist }] = await Promise.all([
      admin.from("operations").select("id,account_id").eq("id", input.operationId).single(), admin.from("fidcs").select("id,name,distribution_email").eq("id", input.fidcId).eq("status", "active").single(), admin.from("fidc_selections").select("id").eq("operation_id", input.operationId).eq("fidc_id", input.fidcId).eq("decision", "approved").maybeSingle(), admin.from("operation_checklists").select("id").eq("operation_id", input.operationId).eq("fidc_id", input.fidcId).maybeSingle(),
    ]);
    if (!operation || !fidc || !selection || !checklist) throw new ApiError(409, "Seleção ou checklist ainda não foi aprovado.", "distribution_not_ready");
    const { data: requirements } = await admin.from("checklist_requirements").select("id,status,item_snapshot").eq("operation_checklist_id", checklist.id);
    if (!requirements?.length || requirements.some((item) => Boolean((item.item_snapshot as { required?: boolean }).required) && item.status !== "approved")) throw new ApiError(409, "Há documentos obrigatórios sem aprovação humana.", "documents_pending");
    const { data: links } = await admin.from("document_requirement_links").select("document_id,requirement_id").in("requirement_id", requirements.map((item) => item.id));
    const documentIds = [...new Set((links ?? []).map((link) => link.document_id))];
    const { data: packageRow, error: packageError } = await admin.from("distribution_packages").insert({ account_id: operation.account_id, operation_id: input.operationId, fidc_id: input.fidcId, status: "sent", manifest: { requirementIds: requirements.map((item) => item.id), documentIds }, authorized_by: context.user.id, authorized_at: new Date().toISOString() }).select("id").single();
    if (packageError?.code === "23505") throw new ApiError(409, "Este pacote já foi distribuído.", "already_distributed");
    if (!packageRow) throw new ApiError(500, "Não foi possível criar o pacote.");
    const deliveryId = randomUUID(); const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); const token = createDeliveryToken(deliveryId, expiresAt);
    const { error: deliveryError } = await admin.from("secure_deliveries").insert({ id: deliveryId, account_id: operation.account_id, package_id: packageRow.id, recipient_email: fidc.distribution_email, link_token_hash: hashDeliveryToken(token), expires_at: expiresAt, status: "queued" });
    if (deliveryError) throw new ApiError(500, "Não foi possível preparar a entrega.");
    await Promise.all([
      admin.from("notification_outbox").insert({ account_id: operation.account_id, operation_id: input.operationId, audience: "fidc", recipient: fidc.distribution_email, template_key: "fidc_distribution", safe_payload: { deliveryId }, dedupe_key: `distribution:${input.operationId}:${input.fidcId}` }),
      admin.from("audit_logs").insert({ actor_user_id: context.user.id, account_id: operation.account_id, action: "distribution.authorized", entity_type: "distribution_package", entity_id: packageRow.id, safe_metadata: { fidcId: input.fidcId, documentCount: documentIds.length, nonce: randomBytes(4).toString("hex") } }),
    ]);
    return NextResponse.json({ data: { packageId: packageRow.id, deliveryId, expiresAt } }, { status: 201 });
  } catch (error) { return apiErrorResponse(error); }
}
