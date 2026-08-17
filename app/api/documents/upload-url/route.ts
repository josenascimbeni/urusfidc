import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireActiveSubscription } from "@/lib/auth/context";
import { uploadRequestSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const mimeExtensions: Record<string, string[]> = {
  "application/pdf": [".pdf"], "application/vnd.ms-excel": [".xls"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"], "text/csv": [".csv"], "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"],
};

export async function POST(request: Request) {
  try {
    const context = await requireActiveSubscription(); const input = uploadRequestSchema.parse(await request.json()); const extension = extname(input.fileName).toLowerCase();
    if (!mimeExtensions[input.mimeType]?.includes(extension)) throw new ApiError(400, "A extensão não corresponde ao formato informado.", "mime_mismatch");
    const supabase = await createServerSupabaseClient();
    const [{ data: operation }, { data: requirements }] = await Promise.all([supabase.from("operations").select("id").eq("id", input.operationId).maybeSingle(), supabase.from("checklist_requirements").select("id").eq("operation_id", input.operationId).in("id", input.requirementIds)]);
    if (!operation || requirements?.length !== input.requirementIds.length) throw new ApiError(404, "Operação ou requisito não encontrado.", "not_found");
    const documentId = randomUUID(); const storagePath = `${context.accountId}/${input.operationId}/${documentId}${extension}`;
    const admin = createAdminSupabaseClient();
    const { error: metadataError } = await admin.from("uploaded_documents").insert({ id: documentId, account_id: context.accountId, operation_id: input.operationId, storage_path: storagePath, original_name: input.fileName, mime_type: input.mimeType, size_bytes: input.sizeBytes, sha256: "pending", uploaded_by: context.user.id });
    if (metadataError) throw new ApiError(500, "Não foi possível preparar o upload.");
    const { error: linkError } = await admin.from("document_requirement_links").insert(input.requirementIds.map((requirementId) => ({ account_id: context.accountId, document_id: documentId, requirement_id: requirementId })));
    if (linkError) { await admin.from("uploaded_documents").delete().eq("id", documentId); throw new ApiError(500, "Não foi possível vincular o arquivo ao checklist."); }
    const { data, error } = await admin.storage.from("documents").createSignedUploadUrl(storagePath, { upsert: false });
    if (error || !data) { await admin.from("uploaded_documents").delete().eq("id", documentId); throw new ApiError(500, "Não foi possível criar o endereço seguro de upload."); }
    return NextResponse.json({ data: { documentId, path: storagePath, token: data.token, signedUrl: data.signedUrl } });
  } catch (error) { return apiErrorResponse(error); }
}
