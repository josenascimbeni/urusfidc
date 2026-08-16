import type { FidcProfile, MatchCriterion, MatchResult, OperationForm } from "./types";

function revenuePasses(operation: OperationForm, fidc: FidcProfile): boolean {
  if (fidc.revenueMode === "Máximo") return operation.annualRevenue <= fidc.minRevenue;
  if (fidc.revenueMode === "Faixa") return operation.annualRevenue >= fidc.minRevenue && operation.annualRevenue <= (fidc.maxRevenue ?? Number.MAX_SAFE_INTEGER);
  return operation.annualRevenue >= fidc.minRevenue;
}

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(value / 100);
}

export function calculateMatches(operation: OperationForm, fidcs: FidcProfile[]): MatchResult[] {
  return fidcs.filter((fidc) => fidc.status === "Ativo").map((fidc) => {
    const revenueOk = revenuePasses(operation, fidc);
    const segmentOk = fidc.segments.includes(operation.segment) || fidc.segments.includes("Outros");
    const operationOk = fidc.operationTypes.includes(operation.operationType);
    const regionOk = fidc.regions.includes("Brasil") || fidc.regions.includes(operation.state);
    const criteria: MatchCriterion[] = [
      { label: "Faturamento", passed: revenueOk, required: fidc.revenueRequired && fidc.revenueMode !== "Pontuação", detail: revenueOk ? `Compatível com regra ${fidc.revenueMode.toLowerCase()} de ${money(fidc.minRevenue)}` : `Não atende à regra ${fidc.revenueMode.toLowerCase()} de ${money(fidc.minRevenue)}` },
      { label: "Segmento", passed: segmentOk, required: true, detail: segmentOk ? `${operation.segment} é atendido` : `${operation.segment} não está no perfil` },
      { label: "Tipo de operação", passed: operationOk, required: true, detail: operationOk ? `${operation.operationType} é aceito` : `${operation.operationType} não é aceito` },
      { label: "Região", passed: regionOk, required: true, detail: regionOk ? `${operation.state} está na área de atuação` : `${operation.state} não está na área de atuação` },
    ];
    const points = [revenueOk ? fidc.weights.revenue : 0, segmentOk ? fidc.weights.segment : 0, operationOk ? fidc.weights.operation : 0, regionOk ? fidc.weights.region : 0];
    const maxPoints = Object.values(fidc.weights).reduce((sum, weight) => sum + weight, 0) || 100;
    const score = Math.round((points.reduce((sum, point) => sum + point, 0) / maxPoints) * 100);
    const eligible = criteria.every((criterion) => !criterion.required || criterion.passed);
    const passedCount = criteria.filter((criterion) => criterion.passed).length;
    const explanation = eligible
      ? `${fidc.name} atende aos ${passedCount} critérios avaliados e apresenta aderência ${score >= 90 ? "muito alta" : "relevante"} à operação.`
      : `${fidc.name} ficou fora da distribuição automática porque ${criteria.filter((criterion) => criterion.required && !criterion.passed).map((criterion) => criterion.label.toLowerCase()).join(" e ")} não atende ao perfil obrigatório.`;
    return { fidc, eligible, score, criteria, explanation };
  }).sort((a, b) => Number(b.eligible) - Number(a.eligible) || b.score - a.score || a.fidc.name.localeCompare(b.fidc.name));
}
