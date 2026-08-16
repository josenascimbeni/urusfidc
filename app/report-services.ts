import type { ChecklistDocument, Commission, FidcProfile, Operation, Proposal, UploadedDocument, User } from "./types";

function currency(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

function safeName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export const ReportService = {
  async operationDossier(operation: Operation, requirements: ChecklistDocument[], fidcs: FidcProfile[]) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.setTextColor(29, 43, 79);
    pdf.setFontSize(20);
    pdf.text("URUS FIDC", 18, 20);
    pdf.setFontSize(14);
    pdf.text("Dossiê da operação", 18, 32);
    pdf.setTextColor(60, 68, 82);
    pdf.setFontSize(10);
    const lines = [
      `Operação: ${operation.id}`,
      `Empresa: ${operation.companyName}`,
      `CNPJ: ${operation.cnpj}`,
      `Segmento: ${operation.segment}`,
      `Localidade: ${operation.city}/${operation.state}`,
      `Faturamento anual: ${currency(operation.annualRevenue)}`,
      `Modalidade: ${operation.operationType}`,
      `Valor solicitado: ${currency(operation.amount)}`,
      `Garantia: ${operation.hasGuarantee ? `${operation.guaranteeType} — ${currency(operation.guaranteeValue)}` : "Sem garantia"}`,
      `FIDCs aprovados: ${operation.selectedFidcs.map((id) => fidcs.find((fidc) => fidc.id === id)?.name ?? id).join(", ") || "Nenhum"}`,
      `Documentos aprovados: ${requirements.filter((requirement) => requirement.status === "Aprovado").length}/${requirements.length}`,
      "",
      "Documento gerado em ambiente demonstrativo. Não representa decisão de crédito.",
    ];
    pdf.text(lines, 18, 45, { maxWidth: 175 });
    pdf.save(`dossie-${safeName(operation.id)}.pdf`);
  },

  async proposalPdf(operation: Operation, proposal: Proposal, fidc: FidcProfile) {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF();
    pdf.setTextColor(29, 43, 79);
    pdf.setFontSize(20);
    pdf.text("URUS FIDC", 18, 20);
    pdf.setFontSize(14);
    pdf.text("Proposta de crédito", 18, 32);
    pdf.setTextColor(60, 68, 82);
    pdf.setFontSize(10);
    pdf.text([
      `Empresa: ${operation.companyName}`,
      `FIDC: ${fidc.name}`,
      `Valor aprovado: ${currency(proposal.approvedAmount)}`,
      `Taxa mensal: ${proposal.monthlyRate.toFixed(2).replace(".", ",")}%`,
      `Prazo: ${proposal.termMonths} meses`,
      `Tarifas: ${currency(proposal.fees)}`,
      `Validade: ${proposal.validityDate}`,
      "",
      "Condições:",
      ...proposal.conditions.map((condition) => `• ${condition}`),
      "",
      "Proposta demonstrativa, sujeita à formalização e documentação definitiva do FIDC.",
    ], 18, 45, { maxWidth: 175 });
    pdf.save(`proposta-${safeName(operation.id)}-${safeName(fidc.name)}.pdf`);
  },

  async pipelineExcel(operations: Operation[], users: User[]) {
    const XLSX = await import("xlsx");
    const rows = operations.map((operation) => ({
      Operação: operation.id,
      Empresa: operation.companyName,
      Profissional: users.find((user) => user.id === operation.ownerId)?.name ?? operation.ownerId,
      Etapa: operation.status,
      Modalidade: operation.operationType,
      Valor: operation.amount / 100,
      UF: operation.state,
      "FIDCs aprovados": operation.selectedFidcs.length,
      Criação: operation.createdAt,
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Pipeline");
    XLSX.writeFile(workbook, "urus-fidc-pipeline.xlsx");
  },

  async commissionsExcel(commissions: Commission[], operations: Operation[], users: User[]) {
    const XLSX = await import("xlsx");
    const rows = commissions.map((commission) => ({
      Operação: commission.operationId,
      Empresa: operations.find((operation) => operation.id === commission.operationId)?.companyName ?? "—",
      Profissional: users.find((user) => user.id === commission.professionalId)?.name ?? commission.professionalId,
      Valor: commission.amount / 100,
      Status: commission.status,
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Comissões");
    XLSX.writeFile(workbook, "urus-fidc-comissoes.xlsx");
  },

  async documentsZip(input: { operation: Operation; requirements: ChecklistDocument[]; documents: UploadedDocument[]; fidc?: FidcProfile }) {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    const relevantRequirements = input.fidc ? input.requirements.filter((requirement) => requirement.fidcId === input.fidc?.id) : input.requirements;
    const requirementIds = new Set(relevantRequirements.map((requirement) => requirement.id));
    const relevantDocuments = input.documents.filter((document) => document.operationId === input.operation.id && document.requirementIds.some((id) => requirementIds.has(id)));
    zip.file("informacoes-operacao.json", JSON.stringify({
      operationId: input.operation.id,
      companyName: input.operation.companyName,
      cnpj: input.operation.cnpj,
      operationType: input.operation.operationType,
      amount: input.operation.amount,
      destination: input.fidc?.name ?? "Urus — pacote consolidado",
      checklist: relevantRequirements.map(({ id, name, detail, status }) => ({ id, name, detail, status })),
    }, null, 2));
    const folder = zip.folder("documentos");
    for (const document of relevantDocuments) {
      if (document.file) folder?.file(document.name, document.file);
      else folder?.file(`${safeName(document.name)}.txt`, "Arquivo demonstrativo sem bytes persistidos.");
    }
    if (!relevantDocuments.length) folder?.file("LEIA-ME.txt", "Nenhum arquivo local foi vinculado a este pacote demonstrativo.");
    const blob = await zip.generateAsync({ type: "blob" });
    const suffix = input.fidc ? safeName(input.fidc.name) : "consolidado";
    download(blob, `pacote-${safeName(input.operation.id)}-${suffix}.zip`);
  },
};
