import type {
  AiDocumentReview,
  ChecklistDocument,
  ChecklistTemplate,
  ChecklistTemplateItem,
  Commission,
  FidcProfile,
  FidcSelection,
  NotificationEvent,
  Operation,
  PlanVersion,
  Proposal,
  Subscription,
  UsagePeriod,
  User,
} from "./types";

export const SEGMENTS = ["Agro", "Indústria", "Varejo", "Construção Civil", "Transportadora", "Serviços", "Facilities", "Outros"];

export const OPERATION_TYPES = [
  "Antecipação de Duplicatas", "Antecipação de Contratos (performado)", "Antecipação de Contratos (à performar)",
  "Antecipação de Cartão de Crédito", "Antecipação de Licitação de Órgãos Públicos", "Capital de Giro", "Nota Comercial",
  "CCB", "CPR", "Contratos Trading", "CDA/WA", "CDCA", "CRA", "CRI", "Conta Escrow", "Risco Sacado", "Importação",
  "Dip Finance", "Barter", "Fomento", "Intercompany",
];

export const BRAZIL_STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const cents = (reais: number) => reais * 100;
const broad = SEGMENTS;
const nationwide = ["Brasil"];
const southeastMidwest = ["SP", "MT", "MS", "MG"];
const baseOps = ["Antecipação de Duplicatas", "Antecipação de Contratos (performado)", "Antecipação de Contratos (à performar)", "Capital de Giro"];
const fullOps = [...baseOps, "Nota Comercial", "CCB", "CPR", "Contratos Trading", "CDA/WA", "CDCA", "CRA", "CRI", "Importação", "Conta Escrow", "Dip Finance"];

const fidc = (id: string, name: string, minRevenue: number, segments: string[], operationTypes: string[], regions: string[]): FidcProfile => ({
  id,
  name,
  email: `credito@${id}.demo.fidc`,
  status: "Ativo",
  minRevenue: cents(minRevenue),
  revenueMode: "Mínimo",
  revenueRequired: true,
  segments,
  operationTypes,
  regions,
  weights: { revenue: 25, segment: 20, operation: 35, region: 20 },
  checklistTemplateId: `tpl-${id}`,
  createdAt: "15/08/2026",
  linkedOperations: Math.floor(minRevenue % 7),
});

export const INITIAL_FIDCS: FidcProfile[] = [
  fidc("multiplica", "Multiplica", 30_000_000, broad, [...baseOps, "Nota Comercial", "CCB", "CPR", "Contratos Trading", "CDA/WA", "CDCA", "CRA", "Conta Escrow"], nationwide),
  fidc("brr", "BRR Crédito", 5_000_000, broad, [...baseOps, "Antecipação de Cartão de Crédito", "Nota Comercial", "Conta Escrow"], nationwide),
  fidc("cacau", "Cacau Crédito", 20_000_000, broad, [...baseOps, "Conta Escrow"], southeastMidwest),
  fidc("delmonte", "Del Monte", 100_000_000, broad, [...baseOps, "CCB"], southeastMidwest),
  fidc("flip", "Flip Digital", 200_000, broad, ["Antecipação de Duplicatas"], nationwide),
  fidc("agpartners", "AG Partners", 6_000_000, ["Indústria", "Serviços"], baseOps, nationwide),
  fidc("invista", "Invista", 30_000_000, broad, [...baseOps, "CPR", "Contratos Trading", "Conta Escrow", "Dip Finance"], nationwide),
  fidc("grancred", "Grancred", 3_000_000, broad, ["Antecipação de Duplicatas", "Antecipação de Contratos (performado)"], ["SP"]),
  fidc("intrabank", "Intrabank", 100_000_000, broad, [...baseOps, "Antecipação de Cartão de Crédito", "CCB", "Nota Comercial", "Risco Sacado", "Conta Escrow"], southeastMidwest),
  fidc("sifra", "Sifra", 60_000_000, broad, fullOps, nationwide),
  fidc("multiplike", "Multiplike", 36_000_000, broad, fullOps, nationwide),
  fidc("acreditar", "Acreditar FIDC", 36_000_000, broad, [...baseOps, "Nota Comercial", "CPR", "Barter", "Risco Sacado", "Fomento", "Intercompany", "Conta Escrow"], nationwide),
  fidc("adgm", "ADGM Banco", 36_000_000, broad, [...baseOps, "CPR", "Risco Sacado", "Fomento", "Intercompany", "Conta Escrow"], nationwide),
  fidc("otmow", "Ótmow", 1_000_000, broad, ["Antecipação de Licitação de Órgãos Públicos", "Conta Escrow"], nationwide),
  fidc("stars", "Stars Bank", 36_000_000, broad, [...baseOps, "Nota Comercial", "Risco Sacado", "Fomento", "Intercompany", "Conta Escrow"], nationwide),
];

export const USERS: User[] = [
  { id: "marina", name: "Marina Costa", initials: "MC", email: "marina@demo.urusfidc.com.br", role: "professional", professionalType: "Assessora de investimentos", plan: "Urus 100", subscriptionStatus: "Ativa" },
  { id: "ricardo", name: "Ricardo Alves", initials: "RA", email: "ricardo@demo.urusfidc.com.br", role: "professional", professionalType: "Consultor financeiro", plan: "Urus 100", subscriptionStatus: "Ativa" },
  { id: "admin", name: "Ana Urus", initials: "AU", email: "admin@demo.urusfidc.com.br", role: "admin" },
];

export const INITIAL_OPERATIONS: Operation[] = [
  { id: "OP-2026-084", ownerId: "marina", companyName: "Aurora Alimentos do Cerrado", cnpj: "12345678000190", segment: "Agro", annualRevenue: cents(45_000_000), city: "Rondonópolis", state: "MT", amount: cents(4_500_000), operationType: "Capital de Giro", hasGuarantee: true, guaranteeValue: cents(6_000_000), guaranteeType: "Recebíveis", salesMethod: "Contratos recorrentes", receiptMethod: "Boleto e PIX", createdAt: "12/08/2026", status: "Documentos", selectedFidcs: ["multiplica", "cacau", "invista"], matchingSubmittedAt: "12/08/2026" },
  { id: "OP-2026-079", ownerId: "marina", companyName: "Vértice Logística Integrada", cnpj: "48210665000102", segment: "Transportadora", annualRevenue: cents(78_000_000), city: "Campinas", state: "SP", amount: cents(2_800_000), operationType: "Antecipação de Duplicatas", hasGuarantee: true, guaranteeValue: cents(3_400_000), guaranteeType: "Duplicatas", salesMethod: "Venda faturada B2B", receiptMethod: "Boleto", createdAt: "05/08/2026", status: "Em análise", selectedFidcs: ["multiplica", "sifra"], matchingSubmittedAt: "05/08/2026" },
  { id: "OP-2026-071", ownerId: "marina", companyName: "Brava Facilities", cnpj: "39482170000111", segment: "Facilities", annualRevenue: cents(42_000_000), city: "São Paulo", state: "SP", amount: cents(1_200_000), operationType: "Antecipação de Contratos (performado)", hasGuarantee: true, guaranteeValue: cents(1_500_000), guaranteeType: "Contratos", salesMethod: "Contratos mensais", receiptMethod: "Transferência", createdAt: "22/07/2026", status: "Aprovada", selectedFidcs: ["multiplica"], matchingSubmittedAt: "22/07/2026" },
  { id: "OP-2026-065", ownerId: "ricardo", companyName: "NorteSul Componentes", cnpj: "21849003000162", segment: "Indústria", annualRevenue: cents(12_000_000), city: "Joinville", state: "SC", amount: cents(900_000), operationType: "Antecipação de Duplicatas", hasGuarantee: false, guaranteeValue: 0, guaranteeType: "", salesMethod: "Venda industrial", receiptMethod: "Boleto", createdAt: "18/07/2026", status: "Qualificação", selectedFidcs: [], matchingSubmittedAt: "18/07/2026" },
];

const allowed = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "image/jpeg", "image/png"];

const item = (id: string, name: string, detail: string, multiplicity: ChecklistTemplateItem["multiplicity"] = "Único", extra: Partial<ChecklistTemplateItem> = {}): ChecklistTemplateItem => ({
  id,
  name,
  detail,
  instructions: `Envie ${name.toLowerCase()} legível e atualizado.`,
  required: true,
  multiplicity,
  allowedMimeTypes: allowed,
  maxSizeMb: 25,
  expectedEvidence: ["Razão social ou CNPJ", "Período de referência", "Documento legível"],
  aiStandard: "Conferir identidade da empresa, período, integridade visual e presença das evidências obrigatórias.",
  active: true,
  order: 0,
  ...extra,
});

export const STANDARD_CHECKLIST_ITEMS: ChecklistTemplateItem[] = [
  item("revenue", "Faturamento anual", "Exercícios de 2024, 2025 e 2026", "Por exercício"),
  item("balance", "Balanço e DRE", "Exercícios de 2024, 2025 e 2026", "Por exercício"),
  item("trial", "Balancete", "Último balancete disponível de 2026"),
  item("debt", "Endividamento bancário e fundos", "Posição atualizada"),
  item("clients", "Curva ABC — clientes", "Base atualizada"),
  item("suppliers", "Curva ABC — fornecedores", "Base atualizada"),
  item("income", "IR do(s) sócio(s)", "Um documento por sócio", "Por sócio"),
  item("articles", "Contrato social", "Última alteração consolidada"),
  item("company-address", "Comprovante de endereço da empresa", "Emitido nos últimos 90 dias", "Único", { validityDays: 90 }),
  item("partner-address", "Comprovante de endereço do(s) sócio(s)", "Um documento por sócio", "Por sócio", { validityDays: 90 }),
  item("partner-id", "Documento pessoal do(s) sócio(s)", "CNH válida", "Por sócio"),
].map((current, order) => ({ ...current, order: order + 1 }));

export const DOCUMENT_BLUEPRINT = STANDARD_CHECKLIST_ITEMS.map((current) => [current.id, current.name, current.detail] as const);

const templateFor = (profile: FidcProfile): ChecklistTemplate => {
  const extras: ChecklistTemplateItem[] = profile.id === "multiplica"
    ? [item("receivables-detail", "Relatório detalhado de recebíveis", "Conciliação por sacado e vencimento")]
    : profile.id === "sifra"
      ? [item("cashflow", "Fluxo de caixa projetado", "Projeção dos próximos 12 meses")]
      : [];
  return {
    id: profile.checklistTemplateId,
    name: `Checklist ${profile.name}`,
    scope: "FIDC",
    fidcId: profile.id,
    status: "Ativo",
    activeVersion: 1,
    versions: [{ id: `${profile.checklistTemplateId}-v1`, version: 1, createdAt: "15/08/2026", createdBy: "admin", items: extras.map((current, index) => ({ ...current, order: index + 1 })) }],
  };
};

export const INITIAL_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  { id: "tpl-standard", name: "Checklist padrão Urus", scope: "Padrão", status: "Ativo", activeVersion: 1, versions: [{ id: "tpl-standard-v1", version: 1, createdAt: "15/08/2026", createdBy: "admin", items: STANDARD_CHECKLIST_ITEMS }] },
  ...INITIAL_FIDCS.map(templateFor),
];

export function activeTemplateItems(template: ChecklistTemplate) {
  const version = template.versions.find((candidate) => candidate.version === template.activeVersion) ?? template.versions[0];
  return version?.items.filter((current) => current.active) ?? [];
}

export function checklistItemsForFidc(fidcId: string, availableTemplates: ChecklistTemplate[] = INITIAL_CHECKLIST_TEMPLATES) {
  const standard = availableTemplates.find((candidate) => candidate.scope === "Padrão");
  const fidcTemplate = availableTemplates.find((candidate) => candidate.fidcId === fidcId);
  return [
    ...activeTemplateItems(standard ?? availableTemplates[0]),
    ...(fidcTemplate ? activeTemplateItems(fidcTemplate) : []),
  ];
}

export function createDocuments(operationId: string, ownerId: string, fidcIds: string[] = ["standard"], availableTemplates: ChecklistTemplate[] = INITIAL_CHECKLIST_TEMPLATES): ChecklistDocument[] {
  return fidcIds.flatMap((fidcId) => {
    const standard = availableTemplates.find((candidate) => candidate.scope === "Padrão") ?? availableTemplates[0];
    const fidcTemplate = availableTemplates.find((candidate) => candidate.fidcId === fidcId);
    const standardItems = activeTemplateItems(standard).map((current) => ({ item: current, template: standard }));
    const additionalItems = fidcTemplate ? activeTemplateItems(fidcTemplate).map((current) => ({ item: current, template: fidcTemplate })) : [];
    return [...standardItems, ...additionalItems].map(({ item: current, template }, index) => ({
      ...current,
      id: `${operationId}-${fidcId}-${current.id}`,
      operationId,
      ownerId,
      fidcId,
      templateId: template.id,
      templateVersion: template.activeVersion,
      status: index < 3 ? "Aprovado" : index < 5 ? "Revisão necessária" : "Pendente",
      uploadedDocumentIds: [],
    }));
  });
}

export const INITIAL_SELECTIONS: FidcSelection[] = INITIAL_OPERATIONS.flatMap((operation) => operation.selectedFidcs.map((fidcId) => ({
  id: `${operation.id}-${fidcId}`,
  operationId: operation.id,
  fidcId,
  origin: "Automático" as const,
  decision: "Aprovado" as const,
  requestedBy: operation.ownerId,
  requestedAt: operation.createdAt,
  decidedBy: "admin",
  decidedAt: operation.createdAt,
})));

export const INITIAL_REVIEWS: AiDocumentReview[] = [];

export const INITIAL_NOTIFICATIONS: NotificationEvent[] = [
  { id: "ntf-1", operationId: "OP-2026-079", audience: "Profissional", title: "Operação em análise", summary: "A Urus atualizou uma etapa da sua operação.", createdAt: "15/08/2026 17:42", status: "Enviado", dedupeKey: "OP-2026-079-analysis-professional" },
  { id: "ntf-2", operationId: "OP-2026-084", audience: "Urus", title: "Documentos aguardando revisão", summary: "Há documentos disponíveis para conferência humana.", createdAt: "15/08/2026 16:18", status: "Na fila", dedupeKey: "OP-2026-084-docs-urus" },
];

export const INITIAL_PLAN_VERSIONS: PlanVersion[] = [
  { id: "urus-100-v1", name: "Urus 100", version: 1, price: cents(99), monthlyCaseLimit: 100, status: "Ativo", effectiveFrom: "01/08/2026" },
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  { id: "sub-marina", userId: "marina", planVersionId: "urus-100-v1", status: "Ativa", cycleStart: "01/08/2026", cycleEnd: "31/08/2026", currentPeriodEnd: "31/08/2026", stripeCustomerPreview: "cus_••••MARINA" },
  { id: "sub-ricardo", userId: "ricardo", planVersionId: "urus-100-v1", status: "Ativa", cycleStart: "01/08/2026", cycleEnd: "31/08/2026", currentPeriodEnd: "31/08/2026", stripeCustomerPreview: "cus_••••RICARDO" },
];

export const INITIAL_USAGE: UsagePeriod[] = [
  { subscriptionId: "sub-marina", cycleStart: "01/08/2026", cycleEnd: "31/08/2026", submittedCases: 3, limit: 100 },
  { subscriptionId: "sub-ricardo", cycleStart: "01/08/2026", cycleEnd: "31/08/2026", submittedCases: 1, limit: 100 },
];

export const INITIAL_PROPOSALS: Proposal[] = [
  { id: "prop-071", operationId: "OP-2026-071", fidcId: "multiplica", approvedAmount: cents(1_200_000), monthlyRate: 1.89, termMonths: 12, fees: cents(8_500), validityDate: "31/08/2026", conditions: ["Formalização das garantias", "Confirmação cadastral"], status: "Aprovada" },
];

export const INITIAL_COMMISSIONS: Commission[] = [
  { id: "com-071", operationId: "OP-2026-071", professionalId: "marina", amount: cents(28_400), status: "Recebida pela Urus FIDC" },
];
