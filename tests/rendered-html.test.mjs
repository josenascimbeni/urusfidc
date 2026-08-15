import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("renderiza a home pública da Urus FIDC", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Urus FIDC/i);
  assert.match(html, /Matching inteligente de crédito/i);
  assert.match(html, /Crédito certo/i);
  assert.match(html, /No FIDC certo/i);
  assert.match(html, /UMA PLATAFORMA. TODA A JORNADA/i);
  assert.match(html, /Acessar plataforma/i);
  assert.match(html, /LGPD por concepção/i);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});
