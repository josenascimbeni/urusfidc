import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../supabase/migrations/202608160001_initial_saas.sql", import.meta.url), "utf8");

test("tabelas de clientes permitem leitura isolada e bloqueiam escrita direta", () => {
  assert.match(migration, /account_isolation_read[\s\S]*for select to authenticated[\s\S]*account_id = public\.current_account_id\(\)/);
  assert.match(migration, /revoke insert, update, delete, truncate[\s\S]*from anon, authenticated/);
  assert.doesNotMatch(migration, /create policy account_isolation on[\s\S]*for all to authenticated/);
});

test("storage privado não possui política de acesso direto do cliente", () => {
  assert.match(migration, /'documents', 'documents', false/);
  assert.match(migration, /'exports', 'exports', false/);
  assert.doesNotMatch(migration, /create policy documents_account_(select|insert|delete)/);
  assert.doesNotMatch(migration, /create policy exports_account_select/);
});

test("auditoria é append-only e impersonação tem duração máxima", () => {
  assert.match(migration, /audit_logs_append_only before update or delete/);
  assert.match(migration, /expires_at <= started_at \+ interval '30 minutes'/);
});

test("consumo é idempotente e individual por operação", () => {
  assert.match(migration, /unique \(operation_id, event_type\)/);
  assert.match(migration, /submitted_cases >= usage\.case_limit/);
  assert.match(migration, /security definer[\s\S]*consume_rate_limit|consume_first_matching_case[\s\S]*security definer/);
});
