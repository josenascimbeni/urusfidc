export type UserRole = "professional" | "admin";
export type ProfessionalType =
  | "Assessor de investimentos"
  | "Assessora de investimentos"
  | "Gerente comercial de banco"
  | "Gerente comercial de FIDC"
  | "Contador"
  | "Consultor financeiro"
  | "Consultor de captação de recursos";

export interface User {
  id: string;
  name: string;
  initials: string;
  email: string;
  role: UserRole;
  professionalType?: ProfessionalType;
  plan?: "Essencial" | "Profissional";
  subscriptionStatus?: "Ativa" | "Pendente";
}

export type FidcStatus = "Rascunho" | "Ativo" | "Inativo" | "Arquivado";
export type RevenueMode = "Mínimo" | "Máximo" | "Faixa" | "Pontuação";

export interface FidcProfile {
  id: string;
  name: string;
  status: FidcStatus;
  minRevenue: number;
  maxRevenue?: number;
  revenueMode: RevenueMode;
  revenueRequired: boolean;
  segments: string[];
  operationTypes: string[];
  regions: string[];
  weights: {
    revenue: number;
    segment: number;
    operation: number;
    region: number;
  };
  createdAt: string;
  linkedOperations: number;
}

export interface OperationForm {
  companyName: string;
  cnpj: string;
  segment: string;
  annualRevenue: number;
  city: string;
  state: string;
  amount: number;
  operationType: string;
  guaranteeValue: number;
  guaranteeType: string;
  salesMethod: string;
  receiptMethod: string;
}

export type OperationStatus = "Qualificação" | "Documentos" | "Em análise" | "Aprovada" | "Negada";

export interface Operation extends OperationForm {
  id: string;
  ownerId: string;
  createdAt: string;
  status: OperationStatus;
  selectedFidcs: string[];
}

export type DocumentStatus = "Pendente" | "Em análise" | "Aprovado" | "Rejeitado";

export interface ChecklistDocument {
  id: string;
  name: string;
  detail: string;
  status: DocumentStatus;
  ownerId: string;
  operationId: string;
}

export interface MatchCriterion {
  label: string;
  passed: boolean;
  required: boolean;
  detail: string;
}

export interface MatchResult {
  fidc: FidcProfile;
  eligible: boolean;
  score: number;
  criteria: MatchCriterion[];
  explanation: string;
}

export interface JourneyState {
  distributed: boolean;
  interested: boolean;
  meetingScheduled: boolean;
  committeeResult: "Pendente" | "Aprovado" | "Negado";
  proposalShared: boolean;
  commission: "Aguardando FIDC" | "Recebida pela Urus FIDC" | "Repassada ao profissional";
}
