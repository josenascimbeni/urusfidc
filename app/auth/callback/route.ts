import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeReturnPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/portal";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const retorno = url.searchParams.get("retorno");
  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const fallback = retorno === "/redefinir-senha" ? "/esqueci-senha?erro=link-invalido" : "/entrar?erro=link-invalido";
      return NextResponse.redirect(new URL(fallback, url.origin));
    }
  }
  return NextResponse.redirect(new URL(safeReturnPath(retorno), url.origin));
}
