import assert from "node:assert/strict";
import test from "node:test";
import { BillingService, formatCnpj, formatMoneyInput, isValidCnpj, parseMoneyInput } from "../app/mock-services";
import type { UsagePeriod } from "../app/types";

test("formata e valida CNPJ com dígitos verificadores", () => {
  assert.equal(formatCnpj("11222333000181"), "11.222.333/0001-81");
  assert.equal(isValidCnpj("11.222.333/0001-81"), true);
  assert.equal(isValidCnpj("11.111.111/1111-11"), false);
  assert.equal(isValidCnpj("11.222.333/0001-82"), false);
});

test("mantém moeda em centavos inteiros", () => {
  assert.equal(parseMoneyInput("R$ 1.234.567,89"), 123456789);
  assert.equal(formatMoneyInput(123456789), "R$ 1.234.567,89");
  assert.equal(parseMoneyInput(""), 0);
});

test("consome apenas novos casos e bloqueia o 101º", () => {
  const usage: UsagePeriod = { subscriptionId: "sub", cycleStart: "01/08/2026", cycleEnd: "31/08/2026", submittedCases: 99, limit: 100 };
  const hundredth = BillingService.consumeCase(usage, false);
  assert.equal(hundredth.submittedCases, 100);
  assert.equal(BillingService.consumeCase(hundredth, true).submittedCases, 100);
  assert.throws(() => BillingService.consumeCase(hundredth, false), /Franquia mensal atingida/);
});
