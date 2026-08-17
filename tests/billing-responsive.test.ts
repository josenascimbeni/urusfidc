import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const billingSetup = readFileSync("components/billing/billing-setup.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

test("formulário de cobrança ocupa uma linha própria no cartão de assinatura", () => {
  assert.match(billingSetup, /billing-setup--profile/);
  assert.match(styles, /\.billing-setup--profile\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/);
});

test("ações e campos podem encolher sem causar rolagem horizontal", () => {
  assert.match(styles, /\.billing-setup,[\s\S]*?\.live-billing-actions,[\s\S]*?min-width:\s*0/);
  assert.match(styles, /grid-template-columns:\s*80px\s+minmax\(0,\s*1fr\)/);
});

test("assinatura vira uma coluna em telas pequenas", () => {
  assert.match(styles, /@media \(max-width:\s*620px\)[\s\S]*?\.live-subscription-gate\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  assert.match(styles, /@media \(max-width:\s*620px\)[\s\S]*?\.partner-access-form\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test("gestão de planos e cupons também se adapta à área útil do painel", () => {
  assert.match(styles, /@media \(max-width:\s*1180px\)[\s\S]*?\.coupon-layout,[\s\S]*?\.plan-management,[\s\S]*?\.integration-grid/);
});
