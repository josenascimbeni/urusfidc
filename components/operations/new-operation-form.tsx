"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BRAZIL_STATES, OPERATION_TYPES, SEGMENTS } from "@/app/mock-data";
import { formatCnpj, formatMoneyInput, parseMoneyInput } from "@/app/mock-services";
import { isValidCnpj, onlyDigits } from "@/lib/domain/cnpj";

export function NewOperationForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookup, setLookup] = useState(false);
  const [cnpj, setCnpj] = useState("");
  const [hasGuarantee, setHasGuarantee] = useState(true);
  const [money, setMoney] = useState({ annualRevenueCents: 0, amountCents: 0, guaranteeValueCents: 0 });

  async function lookupCompany(value: string, form: HTMLFormElement) {
    const digits = onlyDigits(value);
    if (!isValidCnpj(digits)) return;
    setLookup(true);
    const response = await fetch(`/api/company-registry/${digits}`);
    const payload = await response.json();
    setLookup(false);
    if (!response.ok || !payload.data) return;
    const elements = form.elements as typeof form.elements & { companyName: HTMLInputElement; state: HTMLSelectElement; city: HTMLInputElement };
    elements.companyName.value = payload.data.legalName;
    elements.state.value = payload.data.state;
    elements.city.value = payload.data.city;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/operations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      companyName: form.get("companyName"), cnpj: onlyDigits(cnpj), segment: form.get("segment"), annualRevenueCents: money.annualRevenueCents,
      city: form.get("city"), state: form.get("state"), amountCents: money.amountCents, operationType: form.get("operationType"), hasGuarantee,
      guaranteeValueCents: hasGuarantee ? money.guaranteeValueCents : 0, guaranteeType: hasGuarantee ? form.get("guaranteeType") : null,
      salesMethod: form.get("salesMethod"), receiptMethod: form.get("receiptMethod"),
    }) });
    const payload = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(payload.error?.message ?? "Revise os campos informados.");
    router.push(`/portal/operacoes/${payload.data.id}`); router.refresh();
  }

  return <form className="live-operation-form" onSubmit={submit}><section><header><span>01</span><div><h2>Dados da empresa</h2><p>O CNPJ é consultado pelo servidor e permanece isolado na sua conta.</p></div></header><div className="live-form-grid"><label>CNPJ<input value={cnpj} required onChange={(event) => setCnpj(formatCnpj(event.target.value))} onBlur={(event) => lookupCompany(event.target.value, event.currentTarget.form!)} placeholder="00.000.000/0000-00" />{lookup && <small>Consultando cadastro público…</small>}</label><label>Razão social<input name="companyName" required /></label><label>Segmento<select name="segment" required defaultValue=""><option value="" disabled>Selecione</option>{SEGMENTS.map((item) => <option key={item}>{item}</option>)}</select></label><label>Faturamento anual<input required inputMode="numeric" value={formatMoneyInput(money.annualRevenueCents)} onChange={(event) => setMoney((current) => ({ ...current, annualRevenueCents: parseMoneyInput(event.target.value) }))} /></label><label>Estado<select name="state" required defaultValue=""><option value="" disabled>UF</option>{BRAZIL_STATES.map((state) => <option key={state}>{state}</option>)}</select></label><label>Cidade<input name="city" required /></label></div></section><section><header><span>02</span><div><h2>Perfil da operação</h2><p>Valores internos são gravados em centavos inteiros.</p></div></header><div className="live-form-grid"><label>Valor da operação<input required inputMode="numeric" value={formatMoneyInput(money.amountCents)} onChange={(event) => setMoney((current) => ({ ...current, amountCents: parseMoneyInput(event.target.value) }))} /></label><label>Tipo de operação<select name="operationType" required defaultValue=""><option value="" disabled>Selecione</option>{OPERATION_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label><fieldset className="live-guarantee"><legend>Garantia</legend><label><input type="radio" checked={hasGuarantee} onChange={() => setHasGuarantee(true)} /> Possui garantia</label><label><input type="radio" checked={!hasGuarantee} onChange={() => { setHasGuarantee(false); setMoney((current) => ({ ...current, guaranteeValueCents: 0 })); }} /> Não possui garantia</label></fieldset>{hasGuarantee && <><label>Tipo de garantia<input name="guaranteeType" required /></label><label>Valor da garantia<input required inputMode="numeric" value={formatMoneyInput(money.guaranteeValueCents)} onChange={(event) => setMoney((current) => ({ ...current, guaranteeValueCents: parseMoneyInput(event.target.value) }))} /></label></>}<label className="wide">Como vende<input name="salesMethod" required /></label><label className="wide">Como recebe<input name="receiptMethod" required /></label></div></section>{message && <p className="live-form-message" role="alert">{message}</p>}<footer><button type="button" className="secondary-button" onClick={() => router.back()}>Cancelar</button><button className="live-gold-button" disabled={loading || !isValidCnpj(cnpj)}>{loading ? "Salvando…" : "Salvar operação"}</button></footer></form>;
}
