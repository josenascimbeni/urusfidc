const STRIPE_PRICE_ID = /^price_[A-Za-z0-9]+$/;

export function resolveStripePriceId(planPriceId: string | null | undefined, fallbackPriceId: string | undefined) {
  const value = planPriceId?.trim() || fallbackPriceId?.trim() || "";
  return STRIPE_PRICE_ID.test(value) ? value : null;
}

type CheckoutSessionForPurchase = {
  amount_total: number | null;
  client_reference_id: string | null;
  currency: string | null;
  id: string;
  mode: string | null;
  payment_status: string;
  status: string | null;
  subscription: unknown;
};

export function confirmedSubscriptionPurchase(session: CheckoutSessionForPurchase, accountId: string) {
  if (
    session.client_reference_id !== accountId
    || session.mode !== "subscription"
    || session.status !== "complete"
    || session.payment_status !== "paid"
    || !session.subscription
    || session.currency?.toLowerCase() !== "brl"
    || session.amount_total === null
    || session.amount_total <= 0
  ) return null;

  return {
    confirmed: true as const,
    transactionId: session.id,
    value: session.amount_total / 100,
    currency: "BRL" as const,
  };
}
