import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { billingCouponDurationSchema, billingCouponInputSchema, checkoutInputSchema } from "../lib/domain/schemas";

const migration = readFileSync(new URL("../supabase/migrations/20260816191413_billing_coupons.sql", import.meta.url), "utf8");

test("normaliza o código informado no checkout", () => {
  assert.equal(checkoutInputSchema.parse({ couponCode: " urus-100 teste " }).couponCode, "URUS100TESTE");
});

test("valida duração e percentual do cupom", () => {
  assert.equal(billingCouponInputSchema.parse({ code: "TESTE100", name: "Cupom de teste", percentOff: 100, duration: "once", perAccountLimit: 1, testOnly: true }).percentOff, 100);
  assert.throws(() => billingCouponInputSchema.parse({ code: "TESTE50", name: "Cupom recorrente", percentOff: 50, duration: "repeating", perAccountLimit: 1, testOnly: true }), /Informe por quantos meses/);
  assert.throws(() => billingCouponInputSchema.parse({ code: "TESTE101", name: "Cupom inválido", percentOff: 101, duration: "once", perAccountLimit: 1, testOnly: true }));
});

test("reserva é isolada por conta, limitada e inacessível ao navegador", () => {
  assert.match(migration, /revoke all on public\.billing_coupons from anon, authenticated/);
  assert.match(migration, /revoke all on function public\.reserve_billing_coupon[\s\S]*from public, anon, authenticated/);
  assert.match(migration, /account_id = target_account_id[\s\S]*per_account_limit/);
  assert.match(migration, /status in \('reserved', 'applied'\)/);
});

test("cupom padrão de teste concede 100% apenas na primeira mensalidade", () => {
  assert.match(migration, /'URUS100TESTE'[\s\S]*100,[\s\S]*'once',[\s\S]*100,[\s\S]*1,[\s\S]*true,[\s\S]*true/);
});

test("admin escolhe primeira mensalidade, quantidade de meses ou toda a assinatura", () => {
  assert.equal(billingCouponDurationSchema.parse({ duration: "once", durationMonths: null }).duration, "once");
  assert.equal(billingCouponDurationSchema.parse({ duration: "repeating", durationMonths: 6 }).durationMonths, 6);
  assert.equal(billingCouponDurationSchema.parse({ duration: "forever", durationMonths: null }).duration, "forever");
  assert.throws(() => billingCouponDurationSchema.parse({ duration: "repeating", durationMonths: null }), /Informe por quantos meses/);
  assert.throws(() => billingCouponDurationSchema.parse({ duration: "repeating", durationMonths: 37 }));
});

test("cupom existente ganha edição de duração sincronizada com o Stripe", () => {
  const route = readFileSync(new URL("../app/api/admin/coupons/[id]/route.ts", import.meta.url), "utf8");
  const manager = readFileSync(new URL("../components/admin/coupon-manager.tsx", import.meta.url), "utf8");
  assert.match(route, /export async function PUT/);
  assert.match(route, /billing\.coupon_duration_updated/);
  assert.match(route, /coupon_has_active_reservation/);
  assert.match(route, /coupon\.code === "URUS100TESTE"/);
  assert.match(manager, /Editar duração/);
  assert.match(manager, /A alteração vale para novas assinaturas/);
});
