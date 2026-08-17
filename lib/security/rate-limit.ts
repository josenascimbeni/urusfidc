import "server-only";

import { createHash } from "node:crypto";
import { ApiError } from "@/lib/api/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function enforceRateLimit(request: Request, scope: string, maximumRequests: number, windowSeconds: number) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const pepper = process.env.RATE_LIMIT_PEPPER ?? process.env.DELIVERY_TOKEN_PEPPER ?? "local-development";
  const identifier = createHash("sha256").update(`${pepper}:${forwarded}:${scope}`).digest("hex");
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.rpc("consume_rate_limit", { target_key: identifier, maximum_requests: maximumRequests, window_seconds: windowSeconds });
  if (error) throw new ApiError(503, "O controle de acesso está temporariamente indisponível.", "rate_limit_unavailable");
  if (!data) throw new ApiError(429, "Muitas tentativas. Aguarde antes de tentar novamente.", "rate_limited");
}
