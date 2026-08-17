"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/analytics/meta-pixel";

type PurchaseConfirmation = {
  confirmed: true;
  currency: "BRL";
  transactionId: string;
  value: number;
};

const STORAGE_PREFIX = "urus:meta-purchase:";

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
      clearCheckoutParameters();
      return;
    }

    const controller = new AbortController();
    async function confirmAndTrack() {
      const response = await fetch(`/api/billing/checkout/confirmation?session_id=${encodeURIComponent(sessionId!)}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) return;
      const payload = await response.json().catch(() => null) as { data?: PurchaseConfirmation } | null;
      const purchase = payload?.data;
      if (!purchase?.confirmed || purchase.currency !== "BRL" || !Number.isFinite(purchase.value)) return;

      for (let attempt = 0; attempt < 20; attempt += 1) {
        if (trackMetaEvent("Purchase", {
          value: purchase.value,
          currency: purchase.currency,
          content_name: "Urus 100",
          content_type: "product",
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
