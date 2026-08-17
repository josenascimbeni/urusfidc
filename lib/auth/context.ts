import "server-only";

import type { User } from "@supabase/supabase-js";
import { bootstrapAdminEmails } from "@/lib/config/env";
import { ApiError } from "@/lib/api/errors";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AccountContext = {
  user: User;
  accountId: string;
  role: "professional" | "admin";
  subscriptionStatus: string | null;
};

export async function requireAccountContext(): Promise<AccountContext> {
  const supabase = await createServerSupabaseClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new ApiError(401, "Entre novamente para continuar.", "not_authenticated");

  const [{ data: profile }, { data: roleRow }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("account_id").eq("user_id", authData.user.id).single(),
    supabase.from("user_roles").select("role").eq("user_id", authData.user.id).single(),
    supabase.from("subscriptions").select("status").limit(1).maybeSingle(),
  ]);

  let role: "professional" | "admin" = roleRow?.role === "admin" ? "admin" : "professional";
  if (role !== "admin" && authData.user.email && bootstrapAdminEmails().has(authData.user.email.toLowerCase())) {
    const admin = createAdminSupabaseClient();
    await Promise.all([
      admin.from("user_roles").update({ role: "admin" }).eq("user_id", authData.user.id),
      profile?.account_id ? admin.from("customer_accounts").update({ status: "platform" }).eq("id", profile.account_id) : Promise.resolve(),
    ]);
    role = "admin";
  }

  if (!profile?.account_id) throw new ApiError(403, "A conta ainda não foi provisionada.", "account_not_ready");
  return { user: authData.user, accountId: profile.account_id, role, subscriptionStatus: subscription?.status ?? null };
}

export async function requireActiveSubscription() {
  const context = await requireAccountContext();
  if (context.role === "admin") throw new ApiError(403, "Administradores não criam operações de clientes.", "admin_not_customer");
  if (context.subscriptionStatus !== "active") throw new ApiError(402, "Ative sua assinatura para cadastrar operações.", "subscription_required");
  return context;
}

export async function requireAdmin(options: { mfa?: boolean } = {}) {
  const context = await requireAccountContext();
  if (context.role !== "admin") throw new ApiError(403, "Acesso exclusivo da Urus.", "admin_required");
  if (options.mfa) {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (data?.currentLevel !== "aal2") throw new ApiError(403, "Confirme o segundo fator para continuar.", "mfa_required");
  }
  return context;
}
