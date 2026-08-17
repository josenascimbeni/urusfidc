import "server-only";

import * as XLSX from "xlsx";
import { z } from "zod";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const reviewSchema = z.object({
  detectedType: z.string(), confidence: z.number().min(0).max(100), legibility: z.enum(["good", "partial", "insufficient"]), company: z.string().nullable(), period: z.string().nullable(), evidence: z.array(z.string()), missingFields: z.array(z.string()), riskFlags: z.array(z.string()), recommendation: z.enum(["approve", "review", "reject"]),
});

const jsonSchema = {
  name: "urus_document_review",
  strict: true,
  schema: { type: "object", additionalProperties: false, properties: {
    detectedType: { type: "string" }, confidence: { type: "number", minimum: 0, maximum: 100 }, legibility: { type: "string", enum: ["good", "partial", "insufficient"] }, company: { type: ["string", "null"] }, period: { type: ["string", "null"] }, evidence: { type: "array", items: { type: "string" } }, missingFields: { type: "array", items: { type: "string" } }, riskFlags: { type: "array", items: { type: "string" } }, recommendation: { type: "string", enum: ["approve", "review", "reject"] },
  }, required: ["detectedType", "confidence", "legibility", "company", "period", "evidence", "missingFields", "riskFlags", "recommendation"] },
};

function spreadsheetText(buffer: Buffer, mimeType: string) {
  if (mimeType === "text/csv") return buffer.toString("utf8", 0, Math.min(buffer.length, 1_000_000));
  const workbook = XLSX.read(buffer, { type: "buffer", sheetRows: 5000 });
  return workbook.SheetNames.slice(0, 8).map((name) => `Planilha: ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name]).slice(0, 250_000)}`).join("\n\n");
}

export async function processAiReview(reviewId: string) {
  const admin = createAdminSupabaseClient();
  const { data: review } = await admin.from("ai_reviews").select("id,document_id,requirement_id,account_id,document:uploaded_documents(storage_path,original_name,mime_type),requirement:checklist_requirements(item_snapshot)").eq("id", reviewId).single();
  if (!review) throw new Error("review_not_found");
  const document = Array.isArray(review.document) ? review.document[0] : review.document;
  const requirement = Array.isArray(review.requirement) ? review.requirement[0] : review.requirement;
  if (!document || !requirement) throw new Error("review_context_missing");
  const [{ data: settings }, { data: secret }] = await Promise.all([admin.from("integration_settings").select("config").eq("provider", "openrouter").single(), admin.rpc("read_integration_secret", { provider_name: "openrouter" })]);
  if (!secret) throw new Error("openrouter_not_configured");
  const { data: file } = await admin.storage.from("documents").download(document.storage_path);
  if (!file) throw new Error("document_missing");
  const buffer = Buffer.from(await file.arrayBuffer());
  const config = settings?.config as { model?: string; fallbackModel?: string; promptVersion?: string } | null;
  const isSpreadsheet = ["text/csv", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"].includes(document.mime_type);
  const content = isSpreadsheet
    ? [{ type: "text", text: `Conteúdo extraído:\n${spreadsheetText(buffer, document.mime_type)}` }]
    : document.mime_type.startsWith("image/")
      ? [{ type: "image_url", image_url: { url: `data:${document.mime_type};base64,${buffer.toString("base64")}` } }]
      : [{ type: "file", file: { filename: document.original_name, file_data: `data:${document.mime_type};base64,${buffer.toString("base64")}` } }];
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://urusfidc.com.br", "X-Title": "Urus FIDC" }, body: JSON.stringify({ model: config?.model ?? process.env.OPENROUTER_DEFAULT_MODEL, messages: [{ role: "system", content: "Você faz triagem documental financeira. Não tome decisão de crédito e não aprove definitivamente. Responda somente no schema solicitado." }, { role: "user", content: [{ type: "text", text: `Requisito congelado: ${JSON.stringify(requirement.item_snapshot)}. Verifique identidade, período, legibilidade, evidências e ausências.` }, ...content] }], response_format: { type: "json_schema", json_schema: jsonSchema }, provider: { data_collection: "deny", require_parameters: true }, plugins: document.mime_type === "application/pdf" ? [{ id: "file-parser", pdf: { engine: "native" } }] : undefined, temperature: 0, max_tokens: 1400 }) });
  if (!response.ok) throw new Error(`openrouter_${response.status}`);
  const payload = await response.json() as { model?: string; usage?: { prompt_tokens?: number; completion_tokens?: number; cost?: number }; choices?: Array<{ message?: { content?: string } }> };
  const parsed = reviewSchema.parse(JSON.parse(payload.choices?.[0]?.message?.content ?? "{}"));
  await Promise.all([
    admin.from("ai_reviews").update({ status: "completed", result: parsed, model: payload.model ?? config?.model, prompt_version: config?.promptVersion ?? "urus-doc-v1", input_tokens: payload.usage?.prompt_tokens, output_tokens: payload.usage?.completion_tokens, cost_microusd: payload.usage?.cost ? Math.round(payload.usage.cost * 1_000_000) : null, completed_at: new Date().toISOString() }).eq("id", reviewId),
    admin.from("checklist_requirements").update({ status: "review_required" }).eq("id", review.requirement_id),
  ]);
}
