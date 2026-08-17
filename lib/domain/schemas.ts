import { z } from "zod";
import { isValidCnpj, isValidCpf, onlyDigits } from "@/lib/domain/cnpj";

export const professionalTypes = [
  "Assessor de investimentos",
  "Gerente comercial de banco",
  "Gerente comercial de FIDC",
  "Contador",
  "Consultor financeiro",
  "Consultor de captação de recursos",
] as const;

const moneyCents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);

export const operationInputSchema = z.object({
  companyName: z.string().trim().min(2).max(200),
  cnpj: z.string().regex(/^\d{14}$/),
  segment: z.string().trim().min(2).max(100),
  annualRevenueCents: moneyCents.positive(),
  city: z.string().trim().min(2).max(120),
  state: z.string().regex(/^[A-Z]{2}$/),
  amountCents: moneyCents.positive(),
  operationType: z.string().trim().min(2).max(160),
  hasGuarantee: z.boolean(),
  guaranteeValueCents: moneyCents.default(0),
  guaranteeType: z.string().trim().max(160).nullable().optional(),
  salesMethod: z.string().trim().min(2).max(500),
  receiptMethod: z.string().trim().min(2).max(500),
}).superRefine((value, context) => {
  if (value.hasGuarantee && (!value.guaranteeValueCents || !value.guaranteeType)) {
    context.addIssue({ code: "custom", path: ["guaranteeType"], message: "Informe o tipo e o valor da garantia." });
  }
  if (!value.hasGuarantee && (value.guaranteeValueCents !== 0 || value.guaranteeType)) {
    context.addIssue({ code: "custom", path: ["hasGuarantee"], message: "Operações sem garantia devem manter tipo vazio e valor zero." });
  }
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(3).max(160),
  professionalType: z.enum(professionalTypes),
  email: z.email(),
  password: z.string().min(10).max(128),
});

export const impersonationInputSchema = z.object({
  targetAccountId: z.uuid(),
  reason: z.string().trim().min(10).max(500),
});

export const openRouterSettingsSchema = z.object({
  apiKey: z.string().startsWith("sk-or-").min(30).optional(),
  model: z.string().trim().min(3).max(200),
  fallbackModel: z.string().trim().max(200).optional(),
  promptVersion: z.string().trim().min(1).max(50),
  maxCostUsd: z.number().positive().max(100),
});

export const uploadRequestSchema = z.object({
  operationId: z.uuid(),
  fileName: z.string().trim().min(1).max(220).refine((name) => !name.includes("/") && !name.includes("\\"), "Nome de arquivo inválido."),
  mimeType: z.enum([
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "image/jpeg",
    "image/png",
  ]),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024),
  requirementIds: z.array(z.uuid()).min(1).max(50),
});

export const fidcInputSchema = z.object({
  name: z.string().trim().min(2).max(160),
  distributionEmail: z.email(),
  status: z.enum(["draft", "active", "inactive", "archived"]),
  minRevenueCents: moneyCents.positive(),
  maxRevenueCents: moneyCents.positive().nullable().optional(),
  revenueMode: z.enum(["minimum", "maximum", "range", "score_only"]),
  revenueRequired: z.boolean(),
  segments: z.array(z.string().trim().min(2)).min(1),
  operationTypes: z.array(z.string().trim().min(2)).min(1),
  regions: z.array(z.string().trim().min(2)).min(1),
  weights: z.object({ revenue: z.number().int().min(0).max(100), segment: z.number().int().min(0).max(100), operation: z.number().int().min(0).max(100), region: z.number().int().min(0).max(100) }),
  sourceChecklistTemplateId: z.uuid().nullable().optional(),
}).refine((value) => value.revenueMode !== "range" || Boolean(value.maxRevenueCents && value.maxRevenueCents >= value.minRevenueCents), { path: ["maxRevenueCents"], message: "Informe uma faixa de faturamento válida." });

export const uploadCompleteSchema = z.object({ documentId: z.uuid() });

export const distributionInputSchema = z.object({ operationId: z.uuid(), fidcId: z.uuid() });
export const deliveryCodeSchema = z.object({ code: z.string().regex(/^\d{6}$/) });

export const checklistItemInputSchema = z.object({
  templateId: z.uuid(),
  name: z.string().trim().min(2).max(180),
  detail: z.string().trim().min(2).max(500),
  instructions: z.string().trim().min(2).max(1_500),
  required: z.boolean(),
  multiplicity: z.enum(["single", "per_year", "per_partner"]),
  validityDays: z.number().int().positive().max(3_650).nullable().optional(),
  allowedMimeTypes: z.array(z.enum([
    "application/pdf",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv",
    "image/jpeg",
    "image/png",
  ])).min(1),
  maxSizeMb: z.number().int().min(1).max(25),
  expectedEvidence: z.array(z.string().trim().min(1).max(200)).max(30),
  aiStandard: z.string().trim().min(5).max(3_000),
});

export const checklistItemArchiveSchema = z.object({ templateId: z.uuid(), stableKey: z.string().trim().min(3).max(120) });
export const manualSelectionSchema = z.object({ fidcId: z.uuid(), reason: z.string().trim().min(10).max(1_000) });
export const adminSelectionDecisionSchema = z.object({ decision: z.enum(["approved", "rejected"]), reason: z.string().trim().max(1_000).optional() });
export const humanDocumentDecisionSchema = z.object({ decision: z.enum(["approved", "rejected"]), reason: z.string().trim().max(1_000).optional() }).superRefine((value, context) => {
  if (value.decision === "rejected" && (!value.reason || value.reason.length < 5)) context.addIssue({ code: "custom", path: ["reason"], message: "Informe o motivo da rejeição." });
});

export const billingProfileSchema = z.object({
  personType: z.enum(["individual", "company"]), taxId: z.string().transform(onlyDigits), legalName: z.string().trim().min(3).max(200), postalCode: z.string().transform(onlyDigits).refine((value) => value.length === 8, "CEP inválido."), addressLine1: z.string().trim().min(3).max(220), addressLine2: z.string().trim().max(120).optional(), city: z.string().trim().min(2).max(120), state: z.string().regex(/^[A-Z]{2}$/),
}).superRefine((value, context) => { const valid = value.personType === "individual" ? isValidCpf(value.taxId) : isValidCnpj(value.taxId); if (!valid) context.addIssue({ code: "custom", path: ["taxId"], message: value.personType === "individual" ? "CPF inválido." : "CNPJ inválido." }); });

export const planVersionSchema = z.object({ name: z.string().trim().min(3).max(100), priceCents: moneyCents.positive(), monthlyCaseLimit: z.number().int().positive().max(100_000), stripePriceId: z.string().trim().startsWith("price_").max(200) });

export const couponCodeSchema = z.string()
  .trim()
  .transform((value) => value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
  .refine((value) => value.length === 0 || (value.length >= 4 && value.length <= 32), "Cupom inválido.");

export const checkoutInputSchema = z.object({ couponCode: couponCodeSchema.optional().default("") });

export const billingCouponInputSchema = z.object({
  code: couponCodeSchema.refine((value) => value.length >= 4, "Informe um código com pelo menos 4 caracteres."),
  name: z.string().trim().min(3).max(40),
  percentOff: z.number().positive().max(100),
  duration: z.enum(["once", "repeating", "forever"]),
  durationMonths: z.number().int().min(1).max(36).nullable().optional(),
  maxRedemptions: z.number().int().positive().max(1_000_000).nullable().optional(),
  perAccountLimit: z.number().int().min(1).max(100).default(1),
  redeemBy: z.iso.datetime().nullable().optional(),
  testOnly: z.boolean().default(false),
}).superRefine((value, context) => {
  if (value.duration === "repeating" && !value.durationMonths) context.addIssue({ code: "custom", path: ["durationMonths"], message: "Informe por quantos meses o desconto será aplicado." });
  if (value.duration !== "repeating" && value.durationMonths) context.addIssue({ code: "custom", path: ["durationMonths"], message: "Meses só se aplicam a descontos com duração definida." });
  if (value.redeemBy && new Date(value.redeemBy).getTime() <= Date.now()) context.addIssue({ code: "custom", path: ["redeemBy"], message: "A validade deve estar no futuro." });
});

export const billingCouponDurationSchema = z.object({
  duration: z.enum(["once", "repeating", "forever"]),
  durationMonths: z.number().int().min(1).max(36).nullable().optional(),
}).superRefine((value, context) => {
  if (value.duration === "repeating" && !value.durationMonths) context.addIssue({ code: "custom", path: ["durationMonths"], message: "Informe por quantos meses o desconto será aplicado." });
  if (value.duration !== "repeating" && value.durationMonths) context.addIssue({ code: "custom", path: ["durationMonths"], message: "Meses só se aplicam aos cupons com duração definida." });
});
