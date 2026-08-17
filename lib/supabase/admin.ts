import "server-only";

import { createClient } from "@supabase/supabase-js";
import { publicSupabaseConfig, requireServerEnv } from "@/lib/config/env";

export function createAdminSupabaseClient() {
  const config = publicSupabaseConfig();
  if (!config) throw new Error("Supabase ainda não foi configurado.");
  return createClient(config.url, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
