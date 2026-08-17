import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const home = readFileSync("app/page.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

test("home apresenta o plano mensal real e o contato oficial por WhatsApp", () => {
  assert.match(home, /Urus 100/);
  assert.match(home, /R\$ 99,00 cobrados mensalmente/);
  assert.match(home, /<span>100<\/span><small>novos casos por ciclo<\/small>/);
  assert.match(home, /wa\.me\/551131641239/);
  assert.match(home, /assinatura%20da%20Plataforma%20Urus%20Fidc/);
  assert.match(home, /rel="noopener noreferrer"/);
});

test("plano e WhatsApp possuem tratamento responsivo e foco acessível", () => {
  assert.match(styles, /\.landing-plan\s*\{[^}]*grid-template-columns:/);
  assert.match(styles, /\.landing-whatsapp\s*\{[^}]*position:\s*fixed/);
  assert.match(styles, /\.landing-whatsapp\s*\{[^}]*width:\s*52px[^}]*border-radius:\s*50%/);
  assert.match(styles, /\.landing-whatsapp span\s*\{[^}]*clip-path:\s*inset\(50%\)/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*\.landing-whatsapp/);
  assert.match(styles, /\.landing-shell button:focus-visible, \.landing-shell a:focus-visible/);
});
