import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export function publicSupabaseConfig() {
  const parsed = publicSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success
    ? { url: parsed.data.NEXT_PUBLIC_SUPABASE_URL, key: parsed.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }
    : null;
}

export function requireServerEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Configuração ausente: ${name}`);
  return value;
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function demoOnly() {
  return process.env.NEXT_PUBLIC_DEMO_ONLY === "true";
}

export function bootstrapAdminEmails() {
  return new Set((process.env.BOOTSTRAP_ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}
