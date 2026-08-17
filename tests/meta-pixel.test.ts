import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { confirmedSubscriptionPurchase } from "../lib/domain/billing";
import { isMetaPixelId } from "../lib/analytics/meta-pixel";

const paidSession = {
  amount_total: 9900,
  client_reference_id: "account-1",
  currency: "brl",
  id: "cs_test_confirmed",
  mode: "subscription",
  payment_status: "paid",
  status: "complete",
  subscription: "sub_test",
};

test("Pixel ID aceita apenas identificador numérico e nunca usa valor inventado", () => {
  assert.equal(isMetaPixelId(undefined), false);
  assert.equal(isMetaPixelId(""), false);
  assert.equal(isMetaPixelId("pixel_exemplo"), false);
  assert.equal(isMetaPixelId("123456789012345"), true);
});

test("Purchase usa o primeiro pagamento mensal realmente confirmado", () => {
  assert.deepEqual(confirmedSubscriptionPurchase(paidSession, "account-1"), {
    confirmed: true,
    transactionId: "cs_test_confirmed",
    value: 99,
    currency: "BRL",
  });
  assert.equal(confirmedSubscriptionPurchase({ ...paidSession, amount_total: 7920 }, "account-1")?.value, 79.2);
});

test("Purchase é bloqueado sem pagamento ou para outra conta", () => {
  assert.equal(confirmedSubscriptionPurchase({ ...paidSession, payment_status: "unpaid" }, "account-1"), null);
  assert.equal(confirmedSubscriptionPurchase(paidSession, "account-2"), null);
});

test("checkout retorna session_id e eventos ficam nos pontos corretos", () => {
  const checkout = readFileSync(new URL("../app/api/billing/checkout/route.ts", import.meta.url), "utf8");
  const actions = readFileSync(new URL("../components/billing/billing-actions.tsx", import.meta.url), "utf8");
  const purchase = readFileSync(new URL("../components/analytics/meta-purchase.tsx", import.meta.url), "utf8");
  assert.match(checkout, /session_id=\{CHECKOUT_SESSION_ID\}/);
  assert.match(actions, /trackMetaEvent\("InitiateCheckout"/);
  assert.match(purchase, /trackMetaEvent\("Purchase"/);
  assert.match(purchase, /\/api\/billing\/checkout\/confirmation/);
  assert.match(purchase, /transaction_id: purchase\.transactionId/);
  assert.match(purchase, /payment_not_confirmed/);
  assert.match(purchase, /localStorage\.setItem/);
});
