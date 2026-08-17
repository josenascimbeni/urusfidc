"use client";

import { useEffect } from "react";
import { metaPixelDebug, trackMetaEvent } from "@/lib/analytics/meta-pixel";

type PurchaseConfirmation = {
  confirmed: true;
  currency: "BRL";
  transactionId: string;
  value: number;
};

const STORAGE_PREFIX = "urus:meta-purchase:";
const CONFIRMATION_RETRY_DELAYS = [0, 500, 1_000, 2_000, 4_000] as const;

function clearCheckoutParameters() {
  const url = new URL(window.location.href);
  url.searchParams.delete("assinatura");
  url.searchParams.delete("session_id");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function wasTracked(key: string) {
  try {
    return window.localStorage.getItem(key) === "sent";
  } catch {
    return false;
  }
}

function markTracked(key: string) {
  try {
    window.localStorage.setItem(key, "sent");
  } catch {
    // A remoção dos parâmetros ainda evita repetição na navegação atual.
  }
}

export function MetaPurchase({ sessionId }: { sessionId?: string }) {
  useEffect(() => {
    if (!sessionId) return;
    const storageKey = `${STORAGE_PREFIX}${sessionId}`;
    if (wasTracked(storageKey)) {
      metaPixelDebug("Purchase já registrado neste navegador");
      clearCheckoutParameters();
      return;
    }

    const controller = new AbortController();
    async function confirmedPurchase() {
      for (const [attempt, delay] of CONFIRMATION_RETRY_DELAYS.entries()) {
        if (delay) await new Promise((resolve) => window.setTimeout(resolve, delay));
        const response = await fetch(`/api/billing/checkout/confirmation?session_id=${encodeURIComponent(sessionId!)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null) as {
          data?: PurchaseConfirmation;
          error?: { code?: string };
        } | null;
        if (response.ok) return payload?.data ?? null;
        if (response.status !== 409 || payload?.error?.code !== "payment_not_confirmed") {
          metaPixelDebug("confirmação recusada pelo servidor", { status: response.status });
          return null;
        }
        metaPixelDebug("pagamento ainda em confirmação", { attempt: attempt + 1 });
      }
      return null;
    }

    async function confirmAndTrack() {
      const purchase = await confirmedPurchase();
      if (!purchase?.confirmed || purchase.currency !== "BRL" || !Number.isFinite(purchase.value)) return;
      metaPixelDebug("pagamento aprovado pelo Stripe", {
        currency: purchase.currency,
        value: purchase.value,
      });

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (trackMetaEvent("Purchase", {
          value: purchase.value,
          currency: purchase.currency,
          content_name: "Urus 100",
          content_type: "product",
          transaction_id: purchase.transactionId,
        }, purchase.transactionId)) {
          markTracked(storageKey);
          clearCheckoutParameters();
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250));
      }
    }

    confirmAndTrack().catch(() => {
      // A compra não é presumida quando a confirmação do servidor falha.
    });
    return () => controller.abort();
  }, [sessionId]);

  return null;
}
