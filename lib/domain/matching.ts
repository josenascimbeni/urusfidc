export type MatchingOperation = {
  annualRevenueCents: number;
  segment: string;
  operationType: string;
  state: string;
};

export type MatchingFidc = {
  id: string;
  name: string;
  minRevenueCents: number;
  maxRevenueCents?: number | null;
  revenueMode: "minimum" | "maximum" | "range" | "score_only";
  revenueRequired: boolean;
  segments: string[];
  operationTypes: string[];
  regions: string[];
  weights: { revenue: number; segment: number; operation: number; region: number };
};

export type ServerMatchResult = {
  fidcId: string;
  eligible: boolean;
  score: number;
  criteria: Array<{ key: string; passed: boolean; required: boolean; detail: string }>;
  explanation: string;
};

function revenueMatches(operation: MatchingOperation, fidc: MatchingFidc) {
  if (fidc.revenueMode === "maximum") return operation.annualRevenueCents <= fidc.minRevenueCents;
  if (fidc.revenueMode === "range") return operation.annualRevenueCents >= fidc.minRevenueCents && operation.annualRevenueCents <= (fidc.maxRevenueCents ?? Number.MAX_SAFE_INTEGER);
  if (fidc.revenueMode === "score_only") return true;
  return operation.annualRevenueCents >= fidc.minRevenueCents;
}

export function calculateServerMatches(operation: MatchingOperation, fidcs: MatchingFidc[]): ServerMatchResult[] {
  return fidcs.map((fidc) => {
    const passed = {
      revenue: revenueMatches(operation, fidc),
      segment: fidc.segments.includes(operation.segment) || fidc.segments.includes("Outros"),
      operation: fidc.operationTypes.includes(operation.operationType),
      region: fidc.regions.includes("Brasil") || fidc.regions.includes(operation.state),
    };
    const criteria = [
      { key: "revenue", passed: passed.revenue, required: fidc.revenueRequired && fidc.revenueMode !== "score_only", detail: passed.revenue ? "Faturamento compatível" : "Faturamento fora da regra" },
      { key: "segment", passed: passed.segment, required: true, detail: passed.segment ? "Segmento atendido" : "Segmento não atendido" },
      { key: "operation", passed: passed.operation, required: true, detail: passed.operation ? "Modalidade aceita" : "Modalidade não aceita" },
      { key: "region", passed: passed.region, required: true, detail: passed.region ? "Região atendida" : "Região não atendida" },
    ];
    const totalWeight = Object.values(fidc.weights).reduce((total, weight) => total + weight, 0) || 100;
    const score = Math.round((Object.entries(passed).reduce((total, [key, value]) => total + (value ? fidc.weights[key as keyof typeof fidc.weights] : 0), 0) / totalWeight) * 100);
    const eligible = criteria.every((criterion) => !criterion.required || criterion.passed);
    const failures = criteria.filter((criterion) => criterion.required && !criterion.passed).map((criterion) => criterion.detail.toLowerCase());
    return {
      fidcId: fidc.id,
      eligible,
      score,
      criteria,
      explanation: eligible ? `${fidc.name} atende às regras obrigatórias e alcançou ${score}% de aderência.` : `${fidc.name} não entra na distribuição automática: ${failures.join("; ")}.`,
    };
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.fidcId.localeCompare(b.fidcId));
}
