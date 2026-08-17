import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireActiveSubscription } from "@/lib/auth/context";
import { uploadCompleteSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const compatibleTypes: Record<string, string[]> = {
  "application/pdf": ["application/pdf"], "application/vnd.ms-excel": ["application/x-cfb", "application/vnd.ms-excel"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip"], "image/jpeg": ["image/jpeg"], "image/png": ["image/png"], "text/csv": [],
};

export async function POST(request: Request) {
  try {
    const context = await requireActiveSubscription(); const { documentId } = uploadCompleteSchema.parse(await request.json()); const supabase = await createServerSupabaseClient();
    const { data: document } = await supabase.from("uploaded_documents").select("id,operation_id,storage_path,mime_type,size_bytes,sha256").eq("id", documentId).maybeSingle();
    if (!document) throw new ApiError(404, "Documento não encontrado.", "not_found");
    const admin = createAdminSupabaseClient(); const { data: blob, error } = await admin.storage.from("documents").download(document.storage_path);
    if (error || !blob) throw new ApiError(409, "O arquivo ainda não chegou ao armazenamento.", "upload_incomplete");
    const buffer = Buffer.from(await blob.arrayBuffer());
    if (buffer.length !== Number(document.size_bytes)) throw new ApiError(400, "O tamanho recebido não corresponde ao arquivo informado.", "size_mismatch");
    const detected = await fileTypeFromBuffer(buffer);
    const acceptedDetected = compatibleTypes[document.mime_type] ?? [];
    if (document.mime_type !== "text/csv" && (!detected || !acceptedDetected.includes(detected.mime))) {
      await Promise.all([admin.storage.from("documents").remove([document.storage_path]), admin.from("uploaded_documents").delete().eq("id", documentId).eq("account_id", context.accountId)]);
      throw new ApiError(400, "O conteúdo do arquivo não corresponde ao formato permitido.", "content_type_mismatch");
    }
    if (document.mime_type === "text/csv" && buffer.includes(0)) throw new ApiError(400, "O CSV contém dados binários inválidos.", "invalid_csv");
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    await admin.from("uploaded_documents").update({ sha256, malware_scan_status: "not_configured" }).eq("id", documentId).eq("account_id", context.accountId);
    const { data: links } = await supabase.from("document_requirement_links").select("requirement_id").eq("document_id", documentId);
    if (links?.length) {
      await Promise.all([
        admin.from("checklist_requirements").update({ status: "analyzing" }).eq("account_id", context.accountId).in("id", links.map((link) => link.requirement_id)),
        admin.from("ai_reviews").insert(links.map((link) => ({ account_id: context.accountId, document_id: documentId, requirement_id: link.requirement_id, status: "queued" }))),
      ]);
    }
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, account_id: context.accountId, action: "document.uploaded", entity_type: "uploaded_document", entity_id: documentId, safe_metadata: { mimeType: document.mime_type, sizeBytes: buffer.length, malwareScanner: "not_configured" } });
    return NextResponse.json({ data: { documentId, sha256, malwareScanStatus: "not_configured" } });
  } catch (error) { return apiErrorResponse(error); }
}
