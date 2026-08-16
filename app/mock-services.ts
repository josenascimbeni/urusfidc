import type { ApiMunicipios } from "municipios-brasil";
import type {
  AiDocumentReview,
  BillingStatus,
  ChecklistDocument,
  CompanyLookupResult,
  MunicipalityOption,
  NotificationAudience,
  NotificationEvent,
  UploadedDocument,
  UsagePeriod,
} from "./types";

const wait = (milliseconds = 450) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function isValidCnpj(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const calculate = (base: string, weights: number[]) => {
    const sum = base.split("").reduce((total, digit, index) => total + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  const first = calculate(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = calculate(`${digits.slice(0, 12)}${first}`, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits.endsWith(`${first}${second}`);
}

export function formatMoneyInput(cents: number) {
  if (!cents) return "";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function parseMoneyInput(value: string) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) : 0;
}

const COMPANY_FIXTURES: Record<string, CompanyLookupResult> = {
  "12345678000190": { cnpj: "12345678000190", legalName: "Aurora Alimentos do Cerrado Ltda.", state: "MT", city: "Rondonópolis", source: "mock-brasil-api" },
  "48210665000102": { cnpj: "48210665000102", legalName: "Vértice Logística Integrada Ltda.", state: "SP", city: "Campinas", source: "mock-brasil-api" },
  "39482170000111": { cnpj: "39482170000111", legalName: "Brava Facilities Serviços Ltda.", state: "SP", city: "São Paulo", source: "mock-brasil-api" },
  "21849003000162": { cnpj: "21849003000162", legalName: "NorteSul Componentes Industriais Ltda.", state: "SC", city: "Joinville", source: "mock-brasil-api" },
  "11222333000181": { cnpj: "11222333000181", legalName: "Horizonte Agroindustrial Ltda.", state: "MS", city: "Campo Grande", source: "mock-brasil-api" },
};

export type CompanyLookupState = "idle" | "loading" | "found" | "not-found" | "unavailable";

export const CompanyRegistryService = {
  async lookup(cnpj: string): Promise<CompanyLookupResult | null> {
    await wait();
    const digits = onlyDigits(cnpj);
    if (!isValidCnpj(digits)) throw new Error("CNPJ inválido");
    if (digits.endsWith("00")) throw new Error("Serviço indisponível");
    return COMPANY_FIXTURES[digits] ?? null;
  },
};

let municipalityApiPromise: Promise<ApiMunicipios> | null = null;
const loadMunicipalityApi = () => {
  municipalityApiPromise ??= import("municipios-brasil").then(({ carregarMunicipios }) => carregarMunicipios());
  return municipalityApiPromise;
};

export const MunicipalityService = {
  async byState(state: string): Promise<MunicipalityOption[]> {
    if (!state) return [];
    const api = await loadMunicipalityApi();
    return api.porEstado(state as Parameters<ApiMunicipios["porEstado"]>[0]).map((city) => ({ id: String(city.codigoIbge), name: city.nome, state: city.uf }));
  },
};

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/csv",
  "image/jpeg",
  "image/png",
]);

export const DocumentStorageService = {
  async upload(file: File, operationId: string, ownerId: string, requirementIds: string[]): Promise<UploadedDocument> {
    if (!ACCEPTED_TYPES.has(file.type)) throw new Error("Formato não aceito. Use PDF, XLS, XLSX, CSV, JPG ou PNG.");
    if (file.size > 25 * 1024 * 1024) throw new Error("O arquivo ultrapassa o limite de 25 MB.");
    await wait(250);
    return {
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ownerId,
      operationId,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: "16/08/2026 10:30",
      requirementIds,
      file,
    };
  },
};

export const DocumentAiService = {
  async review(document: UploadedDocument, requirement: ChecklistDocument): Promise<AiDocumentReview> {
    await wait(700);
    const lowerName = document.name.toLocaleLowerCase("pt-BR");
    const likelyMatch = requirement.name.toLocaleLowerCase("pt-BR").split(" ").some((word) => word.length > 4 && lowerName.includes(word));
    const readable = document.size > 10_000;
    return {
      id: `ai-${document.id}-${requirement.id}`,
      documentId: document.id,
      requirementId: requirement.id,
      status: "Concluída",
      detectedType: likelyMatch ? requirement.name : "Documento financeiro não confirmado",
      confidence: likelyMatch ? 94 : 72,
      legibility: readable ? "Boa" : "Parcial",
      company: "Empresa declarada na operação",
      period: requirement.detail,
      evidence: readable ? ["Arquivo legível", "Identificação localizada", "Período identificado"] : ["Arquivo recebido"],
      missingFields: likelyMatch ? [] : ["Confirmação inequívoca do tipo documental"],
      riskFlags: readable ? [] : ["Arquivo muito pequeno; revisar legibilidade"],
      recommendation: likelyMatch && readable ? "Aprovar" : "Revisar",
      model: "openrouter/mock-document-reviewer",
      promptVersion: "urus-doc-v1",
    };
  },
};

export const NotificationService = {
  enqueue(events: NotificationEvent[], input: { operationId?: string; audience: NotificationAudience; title: string; summary: string; dedupeKey: string }) {
    if (events.some((event) => event.dedupeKey === input.dedupeKey)) return events;
    return [{ id: `ntf-${Date.now()}`, createdAt: "16/08/2026 10:30", status: "Na fila" as const, ...input }, ...events];
  },
};

export const BillingService = {
  canSubmit(usage: UsagePeriod) {
    return usage.submittedCases < usage.limit;
  },
  consumeCase(usage: UsagePeriod, alreadySubmitted: boolean): UsagePeriod {
    if (alreadySubmitted) return usage;
    if (!this.canSubmit(usage)) throw new Error("Franquia mensal atingida. Solicite um upgrade para enviar novos casos.");
    return { ...usage, submittedCases: usage.submittedCases + 1 };
  },
  checkoutPreview(): BillingStatus {
    return "Ativa";
  },
};
