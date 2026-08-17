import { NextResponse } from "next/server";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";
import { openRouterSettingsSchema } from "@/lib/domain/schemas";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  try { await requireAdmin({ mfa: true }); const admin = createAdminSupabaseClient(); const { data } = await admin.from("integration_settings").select("provider,config,masked_hint,validated_at,updated_at").eq("provider", "openrouter").maybeSingle(); return NextResponse.json({ data }); } catch (error) { return apiErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const context = await requireAdmin({ mfa: true }); const input = openRouterSettingsSchema.parse(await request.json()); const admin = createAdminSupabaseClient(); let vaultSecretId: string | undefined; let maskedHint: string | undefined;
    if (input.apiKey) {
      const check = await fetch("https://openrouter.ai/api/v1/models", { headers: { Authorization: `Bearer ${input.apiKey}` }, signal: AbortSignal.timeout(8000) });
      if (!check.ok) throw new ApiError(400, "A chave do OpenRouter não foi aceita.", "invalid_openrouter_key");
      const { data, error } = await admin.rpc("store_integration_secret", { provider_name: "openrouter", secret_value: input.apiKey });
      if (error || !data) throw new ApiError(500, "Não foi possível proteger a chave no Vault.");
      vaultSecretId = data; maskedHint = `••••${input.apiKey.slice(-4)}`;
    }
    const config = { model: input.model, fallbackModel: input.fallbackModel || null, promptVersion: input.promptVersion, maxCostUsd: input.maxCostUsd, contentLogging: false, malwareScanner: "not_configured" };
    const values: Record<string, unknown> = { provider: "openrouter", config, validated_at: input.apiKey ? new Date().toISOString() : undefined, updated_by: context.user.id, updated_at: new Date().toISOString() };
    if (vaultSecretId) values.vault_secret_id = vaultSecretId;
    if (maskedHint) values.masked_hint = maskedHint;
    const { data, error } = await admin.from("integration_settings").upsert(values, { onConflict: "provider" }).select("provider,config,masked_hint,validated_at").single();
    if (error) throw new ApiError(500, "Não foi possível salvar a integração.");
    await admin.from("audit_logs").insert({ actor_user_id: context.user.id, action: "integration.openrouter.updated", entity_type: "integration", entity_id: "openrouter", safe_metadata: { model: input.model, keyChanged: Boolean(input.apiKey) } });
    return NextResponse.json({ data });
  } catch (error) { return apiErrorResponse(error); }
}
