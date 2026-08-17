"use client";

import { useState } from "react";
import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

export function BillingActions({ hasCustomer }: { hasCustomer: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [couponCode, setCouponCode] = useState("");
  async function open(path: string) {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: path.endsWith("/checkout") ? { "Content-Type": "application/json" } : undefined,
        body: path.endsWith("/checkout") ? JSON.stringify({ couponCode }) : undefined,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error?.message ?? "Não foi possível abrir a cobrança.");
        return;
      }
      const redirectUrl = payload?.data?.redirectUrl;
      if (payload?.data?.activated === true && typeof redirectUrl === "string" && redirectUrl.startsWith("/")) {
        window.location.assign(redirectUrl);
        return;
      }
      const checkoutUrl = payload?.data?.url;
      if (typeof checkoutUrl !== "string" || !checkoutUrl.startsWith("https://")) {
        setMessage("A cobrança não retornou um endereço seguro. Tente novamente.");
        return;
      }
      if (path.endsWith("/checkout")) {
        const value = Number(payload?.data?.value);
        trackMetaEvent("InitiateCheckout", {
          ...(Number.isFinite(value) ? { value } : {}),
          currency: "BRL",
          content_name: "Urus 100",
          content_type: "product",
        });
      }
      window.location.assign(checkoutUrl);
    } catch {
      setMessage("Não foi possível conectar à cobrança. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }
  return <div className="live-billing-actions">{!hasCustomer && <label className="live-coupon-field"><span>Cupom de desconto <small>opcional</small></span><input aria-label="Cupom de desconto" autoCapitalize="characters" autoComplete="off" maxLength={32} placeholder="Digite seu cupom" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}/></label>}<button className="live-gold-button" disabled={loading} onClick={() => open(hasCustomer ? "/api/billing/portal" : "/api/billing/checkout")}>{loading ? "Abrindo…" : hasCustomer ? "Gerenciar assinatura" : couponCode ? "Aplicar cupom e assinar" : "Assinar Urus 100"}</button>{message && <p role="status">{message}</p>}</div>;
}
