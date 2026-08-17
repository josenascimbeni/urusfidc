import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolveStripePriceId } from "../lib/domain/billing";

test("checkout prioriza o preço versionado do plano", () => {
  assert.equal(resolveStripePriceId("price_plano", "price_contingencia"), "price_plano");
});

test("checkout usa a configuração de contingência quando o plano ainda não foi sincronizado", () => {
  assert.equal(resolveStripePriceId(null, "price_contingencia"), "price_contingencia");
});

test("checkout rejeita identificador de preço ausente ou inválido", () => {
  assert.equal(resolveStripePriceId(null, undefined), null);
  assert.equal(resolveStripePriceId("prod_incorreto", ""), null);
});

test("botão de assinatura trata falha de rede e resposta inválida", () => {
  const source = readFileSync(new URL("../components/billing/billing-actions.tsx", import.meta.url), "utf8");
  assert.match(source, /response\.json\(\)\.catch/);
  assert.match(source, /checkoutUrl\.startsWith\("https:\/\/"\)/);
  assert.match(source, /Não foi possível conectar à cobrança/);
  assert.match(source, /finally/);
});

test("checkout permite atualizar nome e endereço para coletar CPF ou CNPJ no Stripe", () => {
  const source = readFileSync(new URL("../app/api/billing/checkout/route.ts", import.meta.url), "utf8");
  assert.match(source, /tax_id_collection: \{ enabled: true \}/);
  assert.match(source, /customer_update: \{ name: "auto", address: "auto" \}/);
  assert.match(source, /idempotencyKey: `checkout-v2-/);
});
