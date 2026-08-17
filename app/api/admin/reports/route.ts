import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { generateReport } from "@/lib/services/report-generator";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const schema = z.object({ accountId: z.uuid(), type: z.enum(["dossier", "proposal", "pipeline", "commissions", "operation_zip"]), operationId: z.uuid().optional() });

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true }); const input = schema.parse(await request.json()); const admin = createAdminSupabaseClient();
    const { data: account } = await admin.from("customer_accounts").select("id").eq("id", input.accountId).maybeSingle(); if (!account) throw new ApiError(404, "Conta não encontrada.", "not_found");
    const generated = await generateReport(input.accountId, input.type, input.operationId); const id = randomUUID(); const path = `${input.accountId}/${id}.${generated.extension}`; const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await admin.from("exports").insert({ id, account_id: input.accountId, operation_id: input.operationId ?? null, requested_by: context.user.id, export_type: input.type, storage_path: path, status: "processing", expires_at: expiresAt });
    const { error } = await admin.storage.from("exports").upload(path, generated.buffer, { contentType: generated.mime, upsert: false }); if (error) throw new ApiError(500, "Não foi possível armazenar o relatório.");
    await admin.from("exports").update({ status: "ready" }).eq("id", id); const { data } = await admin.storage.from("exports").createSignedUrl(path, 600);
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, account_id: input.accountId, action: "admin.report_generated", entity_type: "export", entity_id: id, safe_metadata: { type: input.type } });
    return NextResponse.json({ data: { id, downloadUrl: data?.signedUrl, expiresAt, fileName: `urus-${input.type}.${generated.extension}` } });
  } catch (error) { return apiErrorResponse(error); }
}
