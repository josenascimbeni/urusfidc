"use client";

import { useState } from "react";
import { BRAZIL_STATES } from "@/app/mock-data";
import { BillingActions } from "@/components/billing/billing-actions";

export function BillingSetup({ initialComplete, hasCustomer }: { initialComplete: boolean; hasCustomer: boolean }) {
  const [complete, setComplete] = useState(initialComplete); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false); const [couponMessage, setCouponMessage] = useState(""); const [accessCode, setAccessCode] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setMessage(""); const form = new FormData(event.currentTarget); const response = await fetch("/api/billing/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ personType: form.get("personType"), taxId: form.get("taxId"), legalName: form.get("legalName"), postalCode: form.get("postalCode"), addressLine1: form.get("addressLine1"), addressLine2: form.get("addressLine2"), city: form.get("city"), state: form.get("state") }) }); const payload = await response.json(); setLoading(false); if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível salvar."); setComplete(true); }
  async function activatePartnerAccess(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCouponLoading(true);
    setCouponMessage("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ couponCode: accessCode }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) return setCouponMessage(payload?.error?.message ?? "Não foi possível ativar o código.");
      const redirectUrl = payload?.data?.redirectUrl;
      if (payload?.data?.activated !== true || typeof redirectUrl !== "string" || !redirectUrl.startsWith("/")) return setCouponMessage("Este código não libera acesso direto. Use-o na etapa de assinatura.");
      window.location.assign(redirectUrl);
    } catch {
      setCouponMessage("Não foi possível conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setCouponLoading(false);
    }
  }
  if (complete) return <div className="billing-setup billing-setup--actions"><BillingActions hasCustomer={hasCustomer} /></div>;
  return <div className="billing-setup billing-setup--profile"><form className="partner-access-form" onSubmit={activatePartnerAccess}><div><span className="eyebrow">ACESSO DE PARCEIRO</span><strong>Recebeu um código de acesso?</strong><small>Ative o período promocional sem preencher dados de cobrança ou informar cartão.</small></div><label><span>Código</span><input aria-label="Código de acesso de parceiro" autoCapitalize="characters" autoComplete="off" maxLength={32} placeholder="DIGITE SEU CÓDIGO" value={accessCode} onChange={(event) => setAccessCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} required /></label><button className="live-gold-button" disabled={couponLoading || accessCode.length < 4}>{couponLoading ? "Ativando…" : "Ativar acesso"}</button>{couponMessage && <p className="live-form-message" role="status">{couponMessage}</p>}</form><div className="billing-path-divider"><span>ou continue com a assinatura mensal</span></div><form className="billing-profile-form" onSubmit={submit}><div><label>Tipo<select name="personType" defaultValue="individual"><option value="individual">Pessoa física</option><option value="company">Pessoa jurídica</option></select></label><label>CPF ou CNPJ<input name="taxId" inputMode="numeric" required /></label><label>Nome / razão social<input name="legalName" required /></label><label>CEP<input name="postalCode" inputMode="numeric" required /></label><label className="wide">Endereço<input name="addressLine1" required /></label><label>Complemento<input name="addressLine2" /></label><label>Cidade<input name="city" required /></label><label>UF<select name="state" defaultValue="" required><option value="" disabled>Selecione</option>{BRAZIL_STATES.map((state) => <option key={state}>{state}</option>)}</select></label></div>{message && <p className="live-form-message" role="status">{message}</p>}<button className="live-gold-button" disabled={loading}>{loading ? "Salvando…" : "Salvar e continuar"}</button></form></div>;
}
