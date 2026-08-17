import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panel = readFileSync("components/auth/mfa-panel.tsx", "utf8");
const adminPage = readFileSync("lib/auth/admin-page.ts", "utf8");
const securityPage = readFileSync("app/seguranca/page.tsx", "utf8");
const authProxy = readFileSync("lib/supabase/proxy.ts", "utf8");

test("painel administrativo exige sessão com MFA confirmado", () => {
  assert.match(adminPage, /requireAdmin\(\{ mfa: true \}\)/);
  assert.match(adminPage, /mfa_required/);
});

test("administrador com fator existente recebe novo desafio", () => {
  assert.match(panel, /listFactors\(\)/);
  assert.match(panel, /getAuthenticatorAssuranceLevel\(\)/);
  assert.match(panel, /mfa\.challenge\(\{ factorId \}\)/);
  assert.match(panel, /mfa\.verify/);
  assert.match(panel, /Confirmar acesso/);
});

test("fator MFA incompleto pode ser reiniciado sem criar duplicidade", () => {
  assert.match(panel, /factors\.data\?\.all\.find/);
  assert.match(panel, /factor\.factor_type === "totp"/);
  assert.match(panel, /factor\.status === "unverified"/);
  assert.match(panel, /mfa\.unenroll\(\{ factorId: incompleteFactorId \}\)/);
  assert.match(panel, /Recomeçar configuração/);
  assert.match(panel, /O QR Code anterior não pode ser recuperado/);
});

test("retorno após MFA não aceita destino externo", () => {
  assert.match(panel, /!requestedReturn\.startsWith\("\/\/"\)/);
});

test("tela de segurança distingue senha configurada do MFA pendente", () => {
  assert.match(securityPage, /Senha configurada/);
  assert.match(securityPage, /Agora prossiga com o aplicativo autenticador/);
  assert.match(securityPage, /Alterar senha/);
  assert.match(securityPage, /href="\/redefinir-senha"/);
});

test("segurança sem sessão retorna ao login em vez de gerar erro", () => {
  assert.match(authProxy, /request\.nextUrl\.pathname === "\/seguranca"/);
  assert.match(authProxy, /url\.pathname = "\/entrar"/);
});
