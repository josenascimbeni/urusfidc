import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseConfig } from "@/lib/config/env";

export async function createServerSupabaseClient() {
  const config = publicSupabaseConfig();
  if (!config) throw new Error("Supabase ainda não foi configurado.");
  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components não escrevem cookies; o proxy mantém a sessão atualizada.
        }
      },
    },
  });
}
