import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const read = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("os documentos legais públicos exibem identidade, vigência e contato", () => {
  const sources = [read("app/termos-de-uso/page.tsx"), read("app/aviso-de-privacidade/page.tsx"), read("components/legal/legal-document.tsx")].join("\n");

  assert.match(sources, /35\.028\.407\/0001-01/);
  assert.match(sources, /17\.08\.2026/);
  assert.match(sources, /adm@uruscapital\.com\.br/);
  assert.match(sources, /Departamento Jurídico/);
  assert.match(sources, /Urus Assessoria Empresarial Ltda\./i);
});

test("o cadastro separa aceite dos termos e ciência do aviso", () => {
  const form = read("components/auth/auth-form.tsx");

  assert.match(form, /privacy_terms_version: "2026-08"/);
  assert.match(form, /href="\/termos-de-uso"/);
  assert.match(form, /href="\/aviso-de-privacidade"/);
  assert.match(form, /Li e aceito os/);
  assert.match(form, /declaro que li o/);
});

test("a publicação é encontrável e preserva requisitos de acessibilidade", () => {
  const landing = read("app/page.tsx");
  const component = read("components/legal/legal-document.tsx");
  const css = read("app/globals.css");

  assert.match(landing, /href="\/termos-de-uso"/);
  assert.match(landing, /href="\/aviso-de-privacidade"/);
  assert.match(component, /legal-skip-link/);
  assert.match(component, /aria-current/);
  assert.match(css, /\.legal-topbar a:focus-visible/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.legal-document > section/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.legal-shell/);
});

test("as versões publicadas não mantêm campos de preenchimento", () => {
  const documents = [read("docs/legal/termos-de-uso.md"), read("docs/legal/aviso-de-privacidade.md")].join("\n");

  assert.match(documents, /\*\*Versão:\*\* 2026-08/);
  assert.doesNotMatch(documents, /\[PREENCHER|\[CANAL|\[E-MAIL|minuta para validação/i);
});
