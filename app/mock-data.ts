import type { ChecklistDocument, FidcProfile, Operation, User } from "./types";

export const SEGMENTS = ["Agro", "Indústria", "Varejo", "Construção Civil", "Transportadora", "Serviços", "Facilities", "Outros"];

export const OPERATION_TYPES = [
  "Antecipação de Duplicatas", "Antecipação de Contratos (performado)", "Antecipação de Contratos (à performar)",
  "Antecipação de Cartão de Crédito", "Antecipação de Licitação de Órgãos Públicos", "Capital de Giro", "Nota Comercial",
  "CCB", "CPR", "Contratos Trading", "CDA/WA", "CDCA", "CRA", "CRI", "Conta Escrow", "Risco Sacado", "Importação",
  "Dip Finance", "Barter", "Fomento", "Intercompany",
];

export const BRAZIL_STATES = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

const broad = SEGMENTS;
const nationwide = ["Brasil"];
const southeastMidwest = ["SP", "MT", "MS", "MG"];
const baseOps = ["Antecipação de Duplicatas", "Antecipação de Contratos (performado)", "Antecipação de Contratos (à performar)", "Capital de Giro"];
const fullOps = [...baseOps, "Nota Comercial", "CCB", "CPR", "Contratos Trading", "CDA/WA", "CDCA", "CRA", "CRI", "Importação", "Conta Escrow", "Dip Finance"];

const fidc = (id: string, name: string, minRevenue: number, segments: string[], operationTypes: string[], regions: string[]): FidcProfile => ({
  id, name, status: "Ativo", minRevenue, revenueMode: "Mínimo", revenueRequired: true, segments, operationTypes, regions,
  weights: { revenue: 25, segment: 20, operation: 35, region: 20 }, createdAt: "15/08/2026", linkedOperations: Math.floor(minRevenue % 7),
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
  { id: "marina", name: "Marina Costa", initials: "MC", email: "marina@demo.urusfidc.com.br", role: "professional", professionalType: "Assessora de investimentos", plan: "Profissional", subscriptionStatus: "Ativa" },
  { id: "ricardo", name: "Ricardo Alves", initials: "RA", email: "ricardo@demo.urusfidc.com.br", role: "professional", professionalType: "Consultor financeiro", plan: "Essencial", subscriptionStatus: "Ativa" },
  { id: "admin", name: "Ana Urus", initials: "AU", email: "admin@demo.urusfidc.com.br", role: "admin" },
];

export const INITIAL_OPERATIONS: Operation[] = [
  { id: "OP-2026-084", ownerId: "marina", companyName: "Aurora Alimentos do Cerrado", cnpj: "12.345.678/0001-90", segment: "Agro", annualRevenue: 45_000_000, city: "Rondonópolis", state: "MT", amount: 4_500_000, operationType: "Capital de Giro", guaranteeValue: 6_000_000, guaranteeType: "Recebíveis", salesMethod: "Contratos recorrentes", receiptMethod: "Boleto e PIX", createdAt: "12/08/2026", status: "Documentos", selectedFidcs: ["multiplica", "cacau", "invista"] },
  { id: "OP-2026-079", ownerId: "marina", companyName: "Vértice Logística Integrada", cnpj: "48.210.665/0001-02", segment: "Transportadora", annualRevenue: 78_000_000, city: "Campinas", state: "SP", amount: 2_800_000, operationType: "Antecipação de Duplicatas", guaranteeValue: 3_400_000, guaranteeType: "Duplicatas", salesMethod: "Venda faturada B2B", receiptMethod: "Boleto", createdAt: "05/08/2026", status: "Em análise", selectedFidcs: ["multiplica", "sifra"] },
  { id: "OP-2026-071", ownerId: "marina", companyName: "Brava Facilities", cnpj: "39.482.170/0001-11", segment: "Facilities", annualRevenue: 42_000_000, city: "São Paulo", state: "SP", amount: 1_200_000, operationType: "Antecipação de Contratos (performado)", guaranteeValue: 1_500_000, guaranteeType: "Contratos", salesMethod: "Contratos mensais", receiptMethod: "Transferência", createdAt: "22/07/2026", status: "Aprovada", selectedFidcs: ["multiplica"] },
  { id: "OP-2026-065", ownerId: "ricardo", companyName: "NorteSul Componentes", cnpj: "21.849.003/0001-62", segment: "Indústria", annualRevenue: 12_000_000, city: "Joinville", state: "SC", amount: 900_000, operationType: "Antecipação de Duplicatas", guaranteeValue: 1_100_000, guaranteeType: "Duplicatas", salesMethod: "Venda industrial", receiptMethod: "Boleto", createdAt: "18/07/2026", status: "Qualificação", selectedFidcs: [] },
];

export const DOCUMENT_BLUEPRINT = [
  ["revenue", "Faturamento anual", "Exercícios de 2024, 2025 e 2026"],
  ["balance", "Balanço e DRE", "Exercícios de 2024, 2025 e 2026"],
  ["trial", "Balancete", "Último balancete disponível de 2026"],
  ["debt", "Endividamento bancário e fundos", "Posição atualizada"],
  ["clients", "Curva ABC — clientes", "Base atualizada"],
  ["suppliers", "Curva ABC — fornecedores", "Base atualizada"],
  ["income", "IR do(s) sócio(s)", "Um documento por sócio"],
  ["articles", "Contrato social", "Última alteração consolidada"],
  ["company-address", "Comprovante de endereço da empresa", "Emitido nos últimos 90 dias"],
  ["partner-address", "Comprovante de endereço do(s) sócio(s)", "Um documento por sócio"],
  ["partner-id", "Documento pessoal do(s) sócio(s)", "CNH válida"],
] as const;

export function createDocuments(operationId: string, ownerId: string): ChecklistDocument[] {
  return DOCUMENT_BLUEPRINT.map(([id, name, detail], index) => ({ id: `${operationId}-${id}`, name, detail, operationId, ownerId, status: index < 5 ? "Aprovado" : index < 8 ? "Em análise" : "Pendente" }));
}
