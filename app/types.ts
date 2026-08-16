export type MoneyCents = number;

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
  plan?: string;
  subscriptionStatus?: BillingStatus;
}

export interface CompanyLookupResult {
  cnpj: string;
  legalName: string;
  state: string;
  city: string;
  source: "mock-brasil-api";
}

export interface MunicipalityOption {
  id: string;
  name: string;
  state: string;
}

export type FidcStatus = "Rascunho" | "Ativo" | "Inativo" | "Arquivado";
export type RevenueMode = "Mínimo" | "Máximo" | "Faixa" | "Pontuação";

export interface FidcProfile {
  id: string;
  name: string;
  email: string;
  status: FidcStatus;
  minRevenue: MoneyCents;
  maxRevenue?: MoneyCents;
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
  checklistTemplateId: string;
  createdAt: string;
  linkedOperations: number;
}

export interface OperationForm {
  companyName: string;
  cnpj: string;
  segment: string;
  annualRevenue: MoneyCents;
  city: string;
  state: string;
  amount: MoneyCents;
  operationType: string;
  hasGuarantee: boolean;
  guaranteeValue: MoneyCents;
  guaranteeType: string;
  salesMethod: string;
  receiptMethod: string;
}

export type OperationStatus = "Qualificação" | "Revisão Urus" | "Documentos" | "Em análise" | "Aprovada" | "Negada";
export type FidcSelectionOrigin = "Automático" | "Solicitação manual";
export type FidcSelectionDecision = "Sugerido" | "Solicitado" | "Aprovado" | "Rejeitado";

export interface FidcSelection {
  id: string;
  operationId: string;
  fidcId: string;
  origin: FidcSelectionOrigin;
  decision: FidcSelectionDecision;
  reason?: string;
  requestedBy: string;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export interface Operation extends OperationForm {
  id: string;
  ownerId: string;
  createdAt: string;
  status: OperationStatus;
  selectedFidcs: string[];
  matchingSubmittedAt?: string;
}

export type DocumentStatus = "Pendente" | "Enviado" | "Analisando" | "Revisão necessária" | "Aprovado" | "Rejeitado";
export type ChecklistMultiplicity = "Único" | "Por exercício" | "Por sócio";

export interface ChecklistTemplateItem {
  id: string;
  name: string;
  detail: string;
  instructions: string;
  required: boolean;
  multiplicity: ChecklistMultiplicity;
  validityDays?: number;
  allowedMimeTypes: string[];
  maxSizeMb: number;
  expectedEvidence: string[];
  aiStandard: string;
  active: boolean;
  order: number;
}

export interface ChecklistVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy: string;
  items: ChecklistTemplateItem[];
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  scope: "Padrão" | "FIDC";
  fidcId?: string;
  status: "Ativo" | "Arquivado";
  activeVersion: number;
  versions: ChecklistVersion[];
}

export interface ChecklistRequirement extends ChecklistTemplateItem {
  operationId: string;
  fidcId: string;
  templateId: string;
  templateVersion: number;
  status: DocumentStatus;
  uploadedDocumentIds: string[];
  aiReviewId?: string;
}

export interface ChecklistDocument extends ChecklistRequirement {
  ownerId: string;
}

export interface UploadedDocument {
  id: string;
  ownerId: string;
  operationId: string;
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  requirementIds: string[];
  file?: File;
}

export interface DocumentRequirementLink {
  id: string;
  uploadedDocumentId: string;
  requirementId: string;
  fidcId: string;
}

export interface AiDocumentReview {
  id: string;
  documentId: string;
  requirementId: string;
  status: "Analisando" | "Concluída" | "Falhou";
  detectedType: string;
  confidence: number;
  legibility: "Boa" | "Parcial" | "Insuficiente";
  company?: string;
  period?: string;
  evidence: string[];
  missingFields: string[];
  riskFlags: string[];
  recommendation: "Aprovar" | "Revisar" | "Rejeitar";
  model: string;
  promptVersion: string;
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
  sentToUrus: boolean;
  distributed: boolean;
  interested: boolean;
  meetingScheduled: boolean;
  committeeResult: "Pendente" | "Aprovado" | "Negado";
  proposalShared: boolean;
  commission: "Aguardando FIDC" | "Recebida pela Urus FIDC" | "Repassada ao profissional";
}

export interface DistributionPackage {
  id: string;
  operationId: string;
  fidcId: string;
  requirementIds: string[];
  documentIds: string[];
  createdAt: string;
  status: "Preparando" | "Pronto" | "Enviado";
}

export interface SecureDelivery {
  id: string;
  packageId: string;
  recipientEmail: string;
  expiresAt: string;
  status: "Na fila" | "Enviado" | "Acessado" | "Expirado";
  tokenPreview: string;
}

export type NotificationAudience = "Profissional" | "Urus" | "FIDC";
export interface NotificationEvent {
  id: string;
  operationId?: string;
  audience: NotificationAudience;
  title: string;
  summary: string;
  createdAt: string;
  status: "Na fila" | "Enviado" | "Lido";
  dedupeKey: string;
}

export interface Proposal {
  id: string;
  operationId: string;
  fidcId: string;
  approvedAmount: MoneyCents;
  monthlyRate: number;
  termMonths: number;
  fees: MoneyCents;
  validityDate: string;
  conditions: string[];
  status: "Rascunho" | "Aprovada" | "Negada";
}

export interface Commission {
  id: string;
  operationId: string;
  professionalId: string;
  amount: MoneyCents;
  status: JourneyState["commission"];
}

export interface ReportRequest {
  type: "Dossiê PDF" | "Proposta PDF" | "Pipeline Excel" | "Comissões Excel" | "ZIP consolidado" | "ZIP por FIDC";
  operationId?: string;
  fidcId?: string;
  requestedBy: string;
}

export type BillingStatus = "Ativa" | "Pendente" | "Inadimplente" | "Cancelada";
export interface PlanVersion {
  id: string;
  name: string;
  version: number;
  price: MoneyCents;
  monthlyCaseLimit: number;
  status: "Ativo" | "Arquivado";
  effectiveFrom: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planVersionId: string;
  status: BillingStatus;
  cycleStart: string;
  cycleEnd: string;
  currentPeriodEnd?: string;
  stripeCustomerPreview: string;
}

export interface UsagePeriod {
  subscriptionId: string;
  cycleStart: string;
  cycleEnd: string;
  submittedCases: number;
  limit: number;
}
