import "server-only";

import { jsPDF } from "jspdf";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { ApiError } from "@/lib/api/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type ReportType = "dossier" | "proposal" | "pipeline" | "commissions" | "operation_zip";
const money = (value: number | string | null | undefined) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0) / 100);
const date = (value: string | null | undefined) => value ? new Intl.DateTimeFormat("pt-BR").format(new Date(value)) : "—";

function pdfBuffer(title: string, lines: string[]) {
  const pdf = new jsPDF(); pdf.setFillColor(17, 29, 52); pdf.rect(0, 0, 210, 36, "F"); pdf.setTextColor(185, 153, 74); pdf.setFontSize(11); pdf.text("URUS FIDC", 18, 16); pdf.setTextColor(255, 255, 255); pdf.setFontSize(18); pdf.text(title, 18, 28); pdf.setTextColor(28, 38, 58); pdf.setFontSize(10); let y = 50;
  for (const line of lines) { const wrapped = pdf.splitTextToSize(line, 174); if (y + wrapped.length * 6 > 282) { pdf.addPage(); y = 20; } pdf.text(wrapped, 18, y); y += wrapped.length * 6 + 3; }
  pdf.setFontSize(8); pdf.setTextColor(100); pdf.text("Documento confidencial · gerado pela Urus FIDC", 18, 291);
  return Buffer.from(pdf.output("arraybuffer"));
}

async function loadOperation(accountId: string, operationId?: string) {
  if (!operationId) throw new ApiError(400, "Selecione uma operação.", "operation_required");
  const admin = createAdminSupabaseClient();
  const { data } = await admin.from("operations").select("*,company:companies(*)").eq("account_id", accountId).eq("id", operationId).maybeSingle();
  if (!data) throw new ApiError(404, "Operação não encontrada.", "not_found");
  return data;
}

export async function generateReport(accountId: string, type: ReportType, operationId?: string) {
  const admin = createAdminSupabaseClient();
  if (type === "dossier") {
    const operation = await loadOperation(accountId, operationId); const company = Array.isArray(operation.company) ? operation.company[0] : operation.company;
    const [{ data: events }, { data: matches }] = await Promise.all([admin.from("operation_events").select("event_type,summary,created_at").eq("account_id", accountId).eq("operation_id", operation.id).order("created_at"), admin.from("match_results").select("score,eligible,explanation,fidc_snapshot").eq("account_id", accountId).eq("operation_id", operation.id).order("score", { ascending: false })]);
    const lines = [`Código: ${operation.public_code}`, `Empresa: ${company?.legal_name}`, `CNPJ: ${company?.cnpj}`, `Localização: ${company?.city}/${company?.state}`, `Segmento: ${company?.segment}`, `Faturamento anual: ${money(company?.annual_revenue_cents)}`, `Operação: ${operation.operation_type}`, `Valor: ${money(operation.amount_cents)}`, `Garantia: ${operation.has_guarantee ? `${operation.guarantee_type} — ${money(operation.guarantee_value_cents)}` : "Sem garantia"}`, "", "Matching:", ...(matches ?? []).map((match) => { const fidc = match.fidc_snapshot as { name?: string }; return `${fidc?.name ?? "FIDC"}: ${match.score}% · ${match.eligible ? "elegível" : "fora do perfil"} · ${match.explanation}`; }), "", "Linha do tempo:", ...(events ?? []).map((event) => `${date(event.created_at)} · ${event.summary}`)];
    return { buffer: pdfBuffer(`Dossiê ${operation.public_code}`, lines), mime: "application/pdf", extension: "pdf" };
  }
  if (type === "proposal") {
    const operation = await loadOperation(accountId, operationId); const { data: proposal } = await admin.from("proposals").select("*,fidc:fidcs(name)").eq("account_id", accountId).eq("operation_id", operation.id).eq("status", "approved").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!proposal) throw new ApiError(409, "A proposta só pode ser gerada após aprovação.", "proposal_not_approved"); const fidc = Array.isArray(proposal.fidc) ? proposal.fidc[0] : proposal.fidc;
    return { buffer: pdfBuffer(`Proposta ${operation.public_code}`, [`FIDC: ${fidc?.name}`, `Valor aprovado: ${money(proposal.approved_amount_cents)}`, `Taxa mensal: ${proposal.monthly_rate ?? "—"}%`, `Prazo: ${proposal.term_months ?? "—"} meses`, `Tarifas: ${money(proposal.fees_cents)}`, `Validade: ${date(proposal.validity_date)}`, "", "A aprovação está sujeita às condições formais e contratuais do FIDC."]), mime: "application/pdf", extension: "pdf" };
  }
  if (type === "pipeline") {
    const { data } = await admin.from("operations").select("public_code,status,amount_cents,operation_type,created_at,company:companies(legal_name,segment,state)").eq("account_id", accountId).order("created_at", { ascending: false });
    const rows = (data ?? []).map((item) => { const company = Array.isArray(item.company) ? item.company[0] : item.company; return { Código: item.public_code, Empresa: company?.legal_name, Segmento: company?.segment, UF: company?.state, Modalidade: item.operation_type, "Valor (R$)": Number(item.amount_cents) / 100, Etapa: item.status, Cadastro: date(item.created_at) }; });
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Pipeline"); return { buffer: Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })), mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
  }
  if (type === "commissions") {
    const { data } = await admin.from("commissions").select("amount_cents,status,updated_at,operation:operations(public_code,company:companies(legal_name))").eq("account_id", accountId).order("updated_at", { ascending: false });
    const rows = (data ?? []).map((item) => { const operation = Array.isArray(item.operation) ? item.operation[0] : item.operation; const company = operation && (Array.isArray(operation.company) ? operation.company[0] : operation.company); return { Operação: operation?.public_code, Empresa: company?.legal_name, "Comissão (R$)": Number(item.amount_cents) / 100, Status: item.status, Atualização: date(item.updated_at) }; });
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Comissões"); return { buffer: Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })), mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx" };
  }
  const operation = await loadOperation(accountId, operationId); const zip = new JSZip();
  zip.file("informacoes-da-operacao.json", JSON.stringify({ code: operation.public_code, status: operation.status, operationType: operation.operation_type, amountCents: operation.amount_cents, company: operation.company }, null, 2));
  const { data: documents } = await admin.from("uploaded_documents").select("id,storage_path,original_name").eq("account_id", accountId).eq("operation_id", operation.id).is("deleted_at", null);
  for (const document of documents ?? []) { const { data } = await admin.storage.from("documents").download(document.storage_path); if (data) zip.file(`documentos/${document.id}-${document.original_name}`, Buffer.from(await data.arrayBuffer())); }
  return { buffer: await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }), mime: "application/zip", extension: "zip" };
}
