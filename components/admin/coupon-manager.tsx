"use client";

import { useState } from "react";

type Coupon = {
  id: string;
  code: string;
  name: string;
  percent_off: number | string | null;
  duration: "once" | "repeating" | "forever";
  duration_months: number | null;
  max_redemptions: number | null;
  per_account_limit: number;
  redeem_by: string | null;
  active: boolean;
  test_only: boolean;
  stripe_promotion_code_id: string | null;
  redemption_count?: number;
};

function durationLabel(coupon: Coupon) {
  if (coupon.duration === "forever") return "Enquanto a assinatura estiver ativa";
  if (coupon.duration === "repeating") return `${coupon.duration_months ?? 0} meses`;
  return "Primeira mensalidade";
}

export function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [duration, setDuration] = useState<Coupon["duration"]>("once");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState<Coupon["duration"]>("once");
  const [editDurationMonths, setEditDurationMonths] = useState(3);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createCoupon(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const redeemBy = String(form.get("redeemBy") ?? "");
    const maxRedemptions = Number(form.get("maxRedemptions"));
    const response = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.get("code"),
        name: form.get("name"),
        percentOff: Number(form.get("percentOff")),
        duration,
        durationMonths: duration === "repeating" ? Number(form.get("durationMonths")) : null,
        maxRedemptions: maxRedemptions > 0 ? maxRedemptions : null,
        perAccountLimit: Number(form.get("perAccountLimit")),
        redeemBy: redeemBy ? new Date(redeemBy).toISOString() : null,
        testOnly: form.get("testOnly") === "on",
      }),
    });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível criar o cupom.");
    setCoupons((items) => [payload.data, ...items.filter((item) => item.id !== payload.data.id)]);
    setMessage(`Cupom ${payload.data.code} criado e sincronizado com a cobrança.`);
    event.currentTarget.reset();
    setDuration("once");
  }

  async function toggle(coupon: Coupon) {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !coupon.active }) });
    const payload = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível alterar o cupom.");
    setCoupons((items) => items.map((item) => item.id === coupon.id ? { ...item, active: payload.data.active } : item));
    setMessage(`Cupom ${coupon.code} ${payload.data.active ? "ativado" : "desativado"}.`);
  }

  function beginDurationEdit(coupon: Coupon) {
    setEditingId(coupon.id);
    setEditDuration(coupon.duration);
    setEditDurationMonths(coupon.duration_months ?? 3);
    setMessage("");
  }

  async function updateDuration(event: React.FormEvent<HTMLFormElement>, coupon: Coupon) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration: editDuration, durationMonths: editDuration === "repeating" ? editDurationMonths : null }),
    });
    const payload = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) return setMessage(payload?.error?.message ?? "Não foi possível alterar a duração do cupom.");
    setCoupons((items) => items.map((item) => item.id === coupon.id ? { ...item, ...payload.data } : item));
    setEditingId(null);
    setMessage(`Duração do cupom ${coupon.code} atualizada para ${durationLabel(payload.data)}.`);
  }

  return <section className="coupon-workbench"><header className="coupon-heading"><div><p className="eyebrow">INCENTIVOS COM CONTROLE</p><h2>Cupons</h2><p>Crie códigos rastreáveis, limite o uso por conta e mantenha o Stripe sincronizado.</p></div><span>DESCONTO AUDITADO</span></header><div className="coupon-layout"><form className="integration-card coupon-form" onSubmit={createCoupon}><h3>Novo cupom</h3><div><label>Código<input name="code" minLength={4} maxLength={32} pattern="[A-Za-z0-9]+" placeholder="EXEMPLO100" required /></label><label>Nome do cupom<input name="name" maxLength={40} placeholder="Campanha de lançamento" required /><small>Até 40 caracteres, conforme o Stripe.</small></label></div><div><label>Desconto (%)<input name="percentOff" type="number" min="0.01" max="100" step="0.01" defaultValue="100" required /></label><label>Duração<select name="duration" value={duration} onChange={(event) => setDuration(event.target.value as Coupon["duration"])}><option value="once">Primeira mensalidade</option><option value="repeating">Número de meses</option><option value="forever">Enquanto durar a assinatura</option></select></label></div>{duration === "repeating" && <label>Quantidade de meses<input name="durationMonths" type="number" min="1" max="36" defaultValue="3" required /></label>}<div><label>Limite total de usos<input name="maxRedemptions" type="number" min="1" placeholder="Sem limite" /></label><label>Usos por conta<input name="perAccountLimit" type="number" min="1" max="100" defaultValue="1" required /></label></div><label htmlFor="coupon-redeem-by">Válido para novos usos até<input id="coupon-redeem-by" name="redeemBy" type="datetime-local" /></label><label aria-label="Somente para testes" className="coupon-check" htmlFor="coupon-test-only"><input id="coupon-test-only" name="testOnly" type="checkbox" defaultChecked /><span><strong>Somente para testes</strong><small>Impede o uso quando a cobrança estiver em modo real.</small></span></label><button className="live-gold-button" disabled={loading}>{loading ? "Sincronizando…" : "Criar cupom"}</button></form><div className="coupon-ledger">{coupons.map((coupon) => <article key={coupon.id} className={coupon.active ? "" : "inactive"}><div className="coupon-ticket"><span>{coupon.code}</span><strong>{Number(coupon.percent_off ?? 0).toLocaleString("pt-BR")}%</strong><small>{durationLabel(coupon)}</small></div><div className="coupon-details"><div><strong>{coupon.name}</strong><span>{coupon.test_only ? "Ambiente de teste" : "Disponível em produção"}</span></div><dl><div><dt>Utilizações</dt><dd>{coupon.redemption_count ?? 0}{coupon.max_redemptions ? ` / ${coupon.max_redemptions}` : ""}</dd></div><div><dt>Por conta</dt><dd>{coupon.per_account_limit}</dd></div><div><dt>Status</dt><dd>{coupon.stripe_promotion_code_id ? coupon.active ? "Ativo" : "Inativo" : "Aguardando sincronização"}</dd></div></dl>{editingId === coupon.id ? <form className="coupon-duration-editor" onSubmit={(event) => updateDuration(event, coupon)}><label>Duração do desconto<select value={editDuration} onChange={(event) => setEditDuration(event.target.value as Coupon["duration"])}><option value="once">Primeira mensalidade</option><option value="repeating">Quantidade de meses</option><option value="forever">Toda a assinatura</option></select></label>{editDuration === "repeating" && <label>Meses<input type="number" min="1" max="36" value={editDurationMonths} onChange={(event) => setEditDurationMonths(Number(event.target.value))} required /></label>}<small>A alteração vale para novas assinaturas. Descontos já aplicados mantêm a regra anterior.</small><div><button type="submit" disabled={loading}>{loading ? "Sincronizando…" : "Salvar duração"}</button><button type="button" disabled={loading} onClick={() => setEditingId(null)}>Cancelar</button></div></form> : <div className="coupon-card-actions"><button type="button" disabled={loading || !coupon.stripe_promotion_code_id} onClick={() => beginDurationEdit(coupon)}>Editar duração</button><button type="button" disabled={loading || !coupon.stripe_promotion_code_id} onClick={() => toggle(coupon)}>{coupon.active ? "Desativar" : "Ativar"}</button></div>}</div></article>)}</div></div>{message && <p className="live-form-message coupon-global-message" role="status">{message}</p>}</section>;
}
