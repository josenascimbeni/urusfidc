import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAccountContext } from "@/lib/auth/context";
import { generateReport } from "@/lib/services/report-generator";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const schema = z.object({ type: z.enum(["dossier", "proposal", "pipeline", "commissions", "operation_zip"]), operationId: z.uuid().optional() });

export async function POST(request: Request) {
  try {
    const context = await requireAccountContext(); if (context.role !== "professional") throw new ApiError(403, "Use os relatórios administrativos.", "customer_only");
    const input = schema.parse(await request.json()); const generated = await generateReport(context.accountId, input.type, input.operationId); const id = randomUUID(); const path = `${context.accountId}/${id}.${generated.extension}`; const admin = createAdminSupabaseClient(); const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const { error: rowError } = await admin.from("exports").insert({ id, account_id: context.accountId, operation_id: input.operationId ?? null, requested_by: context.user.id, export_type: input.type, storage_path: path, status: "processing", expires_at: expiresAt });
    if (rowError) throw new ApiError(500, "Não foi possível registrar o relatório.");
    const { error: uploadError } = await admin.storage.from("exports").upload(path, generated.buffer, { contentType: generated.mime, upsert: false });
    if (uploadError) { await admin.from("exports").update({ status: "failed" }).eq("id", id).eq("account_id", context.accountId); throw new ApiError(500, "Não foi possível armazenar o relatório."); }
    await admin.from("exports").update({ status: "ready" }).eq("id", id).eq("account_id", context.accountId); const { data } = await admin.storage.from("exports").createSignedUrl(path, 600);
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, account_id: context.accountId, action: "report.generated", entity_type: "export", entity_id: id, safe_metadata: { type: input.type } });
    return NextResponse.json({ data: { id, downloadUrl: data?.signedUrl, expiresAt, fileName: `urus-${input.type}.${generated.extension}` } });
  } catch (error) { return apiErrorResponse(error); }
}
