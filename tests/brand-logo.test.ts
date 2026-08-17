import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = process.cwd();
const readSource = (path: string) => readFileSync(`${root}/${path}`, "utf8");

test("o arquivo oficial da marca é um PNG válido", () => {
  const asset = readFileSync(`${root}/public/brand/urus-fidc-logo.png`);
  assert.deepEqual([...asset.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(asset.length > 100_000, "a marca não deve ser substituída por um placeholder");
});

test("o componente de marca preserva proporção e nome acessível", () => {
  const source = readSource("components/brand-logo.tsx");
  assert.match(source, /src="\/brand\/urus-fidc-logo\.png"/);
  assert.match(source, /alt="Urus FIDC"/);
  assert.match(source, /width=\{422\}/);
  assert.match(source, /height=\{149\}/);
});

test("a marca oficial está presente em todas as superfícies principais", () => {
  const pages = [
    "app/page.tsx",
    "app/entrar/page.tsx",
    "app/cadastro/page.tsx",
    "app/esqueci-senha/page.tsx",
    "app/redefinir-senha/page.tsx",
    "app/portal/layout.tsx",
    "app/admin/layout.tsx",
    "app/entrega/[token]/page.tsx",
    "app/seguranca/page.tsx",
  ];

  for (const page of pages) {
    const source = readSource(page);
    assert.match(source, /BrandLogo/, `${page} deve usar a marca oficial`);
    assert.doesNotMatch(source, /className="brand-mark[^"]*">U<\/span>/, `${page} ainda contém a marca provisória`);
  }
});

test("a marca tem tamanhos responsivos e recorte compacto do símbolo", () => {
  const css = readSource("app/globals.css");
  assert.match(css, /\.brand-logo--landing/);
  assert.match(css, /\.brand-logo--auth/);
  assert.match(css, /\.brand-logo--sidebar/);
  assert.match(css, /\.live-sidebar \.live-brand[\s\S]*overflow: hidden/);
});
