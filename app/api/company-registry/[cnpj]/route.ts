import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAccountContext } from "@/lib/auth/context";
import { isValidCnpj, onlyDigits } from "@/lib/domain/cnpj";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export async function GET(request: Request, context: { params: Promise<{ cnpj: string }> }) {
  try {
    await requireAccountContext();
    await enforceRateLimit(request, "company-registry", 30, 60);
    const cnpj = onlyDigits((await context.params).cnpj);
    if (!isValidCnpj(cnpj)) throw new ApiError(400, "Informe um CNPJ válido.", "invalid_cnpj");
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json", "User-Agent": "Urus-FIDC/1.0" },
      next: { revalidate: 86400 },
    });
    if (response.status === 404) return NextResponse.json({ data: null });
    if (!response.ok) throw new ApiError(503, "A consulta automática está indisponível. Continue o preenchimento manual.", "registry_unavailable");
    const data = await response.json() as Record<string, unknown>;
    return NextResponse.json({ data: {
      cnpj,
      legalName: String(data.razao_social ?? ""),
      state: String(data.uf ?? ""),
      city: String(data.municipio ?? ""),
      source: "brasilapi",
    } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
