import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const authForm = readFileSync("components/auth/auth-form.tsx", "utf8");
const recoveryForm = readFileSync("components/auth/password-recovery-form.tsx", "utf8");
const callbackRoute = readFileSync("app/auth/callback/route.ts", "utf8");
const updatePage = readFileSync("app/redefinir-senha/page.tsx", "utf8");
const supabaseConfig = readFileSync("supabase/config.toml", "utf8");

test("login oferece recuperação de senha", () => {
  assert.match(authForm, /href="\/esqueci-senha"/);
  assert.match(authForm, /Esqueci minha senha/);
});

test("recuperação usa callback seguro e resposta neutra", () => {
  assert.match(recoveryForm, /resetPasswordForEmail/);
  assert.match(recoveryForm, /\/auth\/callback\?retorno=\/redefinir-senha/);
  assert.match(recoveryForm, /Se houver uma conta vinculada a esse e-mail/);
});

test("nova senha exige confirmação e encerra todas as sessões", () => {
  assert.match(recoveryForm, /password !== confirmation/);
  assert.match(recoveryForm, /minLength=\{10\}/);
  assert.match(recoveryForm, /updateUser\(\{ password \}\)/);
  assert.match(recoveryForm, /signOut\(\{ scope: "global" \}\)/);
});

test("página de troca exige usuário autenticado pelo link", () => {
  assert.match(updatePage, /auth\.getUser\(\)/);
  assert.match(updatePage, /redirect\("\/esqueci-senha\?erro=link-invalido"\)/);
});

test("callback trata código inválido e bloqueia retorno externo", () => {
  assert.match(callbackRoute, /exchangeCodeForSession/);
  assert.match(callbackRoute, /if \(error\)/);
  assert.match(callbackRoute, /!value\.startsWith\("\/\/"\)/);
});

test("recuperação aceita os domínios oficiais de produção", () => {
  assert.match(supabaseConfig, /https:\/\/www\.urusfidc\.com\.br\/auth\/callback/);
  assert.match(supabaseConfig, /https:\/\/urusfidc\.com\.br\/auth\/callback/);
  assert.match(supabaseConfig, /https:\/\/urus-fidc\.vercel\.app\/auth\/callback/);
});
