"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function RequestPasswordResetForm() {
  const search = useSearchParams();
  const supabase = createBrowserSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState(() => search.get("erro") === "link-invalido" ? "O link expirou ou já foi utilizado. Solicite um novo acesso abaixo." : "");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return setMessage("O ambiente real ainda não foi conectado ao Supabase.");
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?retorno=/redefinir-senha` });
    setLoading(false);
    setSent(true);
    setMessage("Se houver uma conta vinculada a esse e-mail, você receberá as instruções para criar uma nova senha.");
  }

  return <form className="live-auth-form" onSubmit={submit}><label htmlFor="recovery-email">E-mail profissional<input id="recovery-email" name="email" type="email" required autoComplete="email" disabled={sent} /></label>{message && <p className="live-form-message" role="status">{message}</p>}<button className="live-gold-button" disabled={loading || sent || !supabase}>{loading ? "Enviando…" : sent ? "Instruções enviadas" : "Enviar instruções"}</button><p className="live-auth-switch"><Link href="/entrar">← Voltar para o acesso</Link></p></form>;
}

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return setMessage("O ambiente real ainda não foi conectado ao Supabase.");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password.length < 10) return setMessage("A nova senha deve possuir pelo menos 10 caracteres.");
    if (password !== confirmation) return setMessage("As senhas informadas não são iguais.");

    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      return setMessage(error.message.toLowerCase().includes("same password") ? "Escolha uma senha diferente da atual." : "O link expirou ou não é mais válido. Solicite uma nova recuperação.");
    }
    await supabase.auth.signOut({ scope: "global" });
    router.replace("/entrar?senha=atualizada");
    router.refresh();
  }

  return <form className="live-auth-form" onSubmit={submit}><label htmlFor="new-password">Nova senha<input id="new-password" name="password" type="password" minLength={10} required autoComplete="new-password" /><small>Mínimo de 10 caracteres.</small></label><label htmlFor="confirm-password">Confirmar nova senha<input id="confirm-password" name="confirmation" type="password" minLength={10} required autoComplete="new-password" /></label>{message && <p className="live-form-message" role="alert">{message}</p>}<button className="live-gold-button" disabled={loading || !supabase}>{loading ? "Atualizando…" : "Criar nova senha"}</button><p className="live-auth-switch"><Link href="/esqueci-senha">Solicitar outro link</Link></p></form>;
}
