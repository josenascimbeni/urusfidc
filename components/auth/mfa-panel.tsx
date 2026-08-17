"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function MfaPanel() {
  const router = useRouter();
  const search = useSearchParams();
  const supabase = createBrowserSupabaseClient();
  const [factorId, setFactorId] = useState("");
  const [incompleteFactorId, setIncompleteFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [sessionVerified, setSessionVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    void Promise.all([
      supabase.auth.mfa.listFactors(),
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]).then(([factors, assurance]) => {
      setChecking(false);
      if (factors.error || assurance.error) {
        setMessage("Não foi possível consultar a configuração do MFA. Atualize a página e tente novamente.");
        return;
      }
      const verified = factors.data?.totp.find((factor: { status: string; id: string }) => factor.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        const currentSessionVerified = assurance.data?.currentLevel === "aal2";
        setSessionVerified(currentSessionVerified);
        setMessage(currentSessionVerified ? "MFA confirmado nesta sessão." : "Digite o código atual do seu aplicativo autenticador.");
        return;
      }

      const incomplete = factors.data?.all.find((factor: { status: string; id: string; factor_type: string }) => factor.factor_type === "totp" && factor.status === "unverified");
      if (incomplete) {
        setIncompleteFactorId(incomplete.id);
        setMessage("Encontramos uma configuração anterior que não foi concluída. Recomece para gerar um novo QR Code.");
      }
    });
  }, [supabase]);

  async function createEnrollment() {
    if (!supabase) return;
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Urus FIDC" });
    if (error) {
      setMessage(error.message.includes("already exists")
        ? "Já existe uma configuração de MFA incompleta. Atualize a página para retomá-la com segurança."
        : "Não foi possível gerar o QR Code. Tente novamente.");
      return false;
    }
    setFactorId(data.id);
    setIncompleteFactorId("");
    setQr(data.totp.qr_code);
    setMessage("Escaneie o QR Code e informe o código gerado.");
    return true;
  }

  async function enroll() {
    if (!supabase) return;
    setLoading(true);
    await createEnrollment();
    setLoading(false);
  }

  async function restartEnrollment() {
    if (!supabase || !incompleteFactorId) return;
    setLoading(true);
    setMessage("Removendo apenas a configuração incompleta…");
    const removal = await supabase.auth.mfa.unenroll({ factorId: incompleteFactorId });
    if (removal.error) {
      setLoading(false);
      setMessage("Não foi possível reiniciar a configuração. Saia da conta, entre novamente e tente outra vez.");
      return;
    }
    setIncompleteFactorId("");
    await createEnrollment();
    setLoading(false);
  }

  async function verify() {
    if (!supabase || !factorId) return;
    setLoading(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setLoading(false);
      return setMessage("Não foi possível iniciar a confirmação. Tente novamente.");
    }
    const result = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code });
    setLoading(false);
    if (result.error) return setMessage("Código inválido ou expirado.");
    setSessionVerified(true);
    setMessage("MFA confirmado. Abrindo o painel administrativo…");
    const requestedReturn = search.get("retorno");
    router.replace(requestedReturn?.startsWith("/") && !requestedReturn.startsWith("//") ? requestedReturn : "/admin");
    router.refresh();
  }

  return <section className="live-mfa-panel" aria-busy={loading || checking}><p className="eyebrow">SEGUNDO FATOR</p><h2>Aplicativo autenticador</h2><p>Administradores precisam confirmar um código TOTP antes de acessar dados globais ou impersonar um profissional.</p>{checking && <p className="live-form-message" role="status">Consultando sua configuração…</p>}{!checking && !factorId && !incompleteFactorId && <button className="live-gold-button" disabled={loading} onClick={enroll}>{loading ? "Preparando…" : "Configurar MFA"}</button>}{!checking && incompleteFactorId && <div className="mfa-recovery-card"><p><strong>Configuração incompleta</strong><span>O QR Code anterior não pode ser recuperado. Gere um novo para concluir a proteção da conta.</span></p><button className="live-gold-button" disabled={loading} onClick={restartEnrollment}>{loading ? "Reiniciando…" : "Recomeçar configuração"}</button></div>}{factorId && !sessionVerified && <div className={`live-mfa-enroll${qr ? "" : " existing-factor"}`}>{qr ? <Image src={qr} width={180} height={180} unoptimized alt="QR Code para configurar o autenticador"/> : <div className="mfa-code-mark" aria-hidden="true">••••••</div>}<label>Código de 6 dígitos<input value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-describedby="mfa-status" onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}/></label><button className="live-gold-button" disabled={loading || code.length !== 6} onClick={verify}>{loading ? "Confirmando…" : qr ? "Ativar e continuar" : "Confirmar acesso"}</button></div>}{message && <p id="mfa-status" className="live-form-message" role="status">{message}</p>}</section>;
}
