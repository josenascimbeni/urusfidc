"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  return <button className="live-text-button" onClick={async () => { await createBrowserSupabaseClient()?.auth.signOut(); router.replace("/"); router.refresh(); }}>Sair</button>;
}
