"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { professionalTypes } from "@/lib/domain/schemas";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = createBrowserSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(() => {
    if (search.get("senha") === "atualizada") return "Senha atualizada. Entre novamente com sua nova credencial.";
    if (search.get("erro") === "link-invalido") return "O link de acesso expirou ou não é mais válido.";
    return "";
  });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return setMessage("O ambiente real ainda não foi conectado ao Supabase.");
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMessage("E-mail ou senha inválidos.");
      router.replace(search.get("retorno")?.startsWith("/") ? search.get("retorno")! : "/portal");
      router.refresh();
      return;
    }
    const fullName = String(form.get("fullName") ?? "").trim();
    const professionalType = String(form.get("professionalType") ?? "");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, professional_type: professionalType, privacy_terms_version: "2026-08" }, emailRedirectTo: `${window.location.origin}/auth/callback?retorno=/portal` },
    });
    setLoading(false);
    setMessage(error ? error.message : "Cadastro recebido. Confirme o e-mail para ativar sua conta independente.");
  }

  return (
    <form className="live-auth-form" onSubmit={submit}>
      {mode === "signup" && <>
        <label>Nome completo<input name="fullName" required minLength={3} autoComplete="name" /></label>
        <label>Atuação profissional<select name="professionalType" required defaultValue=""><option value="" disabled>Selecione</option>{professionalTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
      </>}
      <label>E-mail profissional<input name="email" type="email" required autoComplete="email" /></label>
      <div className="live-password-field"><div><label htmlFor={`${mode}-password`}>Senha</label>{mode === "signin" && <Link href="/esqueci-senha">Esqueci minha senha</Link>}</div><input id={`${mode}-password`} name="password" type="password" required minLength={10} autoComplete={mode === "signin" ? "current-password" : "new-password"} /><small>Mínimo de 10 caracteres.</small></div>
      {mode === "signup" && <div className="auth-consent"><input id="legal-consent" name="consent" type="checkbox" required /><label htmlFor="legal-consent">Li e aceito os <Link href="/termos-de-uso" target="_blank" rel="noopener noreferrer">Termos de Uso</Link> e declaro que li o <Link href="/aviso-de-privacidade" target="_blank" rel="noopener noreferrer">Aviso de Privacidade</Link>.</label></div>}
      {message && <p className="live-form-message" role="status">{message}</p>}
      <button className="live-gold-button" disabled={loading || !supabase}>{loading ? "Processando…" : mode === "signin" ? "Entrar na plataforma" : "Criar minha conta"}</button>
      {!supabase && <p className="live-setup-note">A produção ainda precisa das novas credenciais do Supabase configuradas diretamente na Vercel.</p>}
      <p className="live-auth-switch">{mode === "signin" ? <>Ainda não possui conta? <Link href="/cadastro">Criar conta</Link></> : <>Já possui conta? <Link href="/entrar">Entrar</Link></>}</p>
    </form>
  );
}
