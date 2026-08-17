-- Endurecimento pós-auditoria: funções SECURITY DEFINER não devem herdar
-- EXECUTE do papel PUBLIC, e funções de trigger não são RPCs públicas.

alter function public.set_updated_at() set search_path = public, pg_temp;
alter function public.prevent_account_change() set search_path = public, pg_temp;
alter function public.reject_audit_mutation() set search_path = public, pg_temp;

revoke all on function public.current_account_id() from public, anon;
revoke all on function public.current_user_is_admin() from public, anon;
revoke all on function public.consume_first_matching_case(uuid) from public, anon;

grant execute on function public.current_account_id() to authenticated, service_role;
grant execute on function public.current_user_is_admin() to authenticated, service_role;
grant execute on function public.consume_first_matching_case(uuid) to authenticated, service_role;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.prevent_account_change() from public, anon, authenticated;
revoke all on function public.reject_audit_mutation() from public, anon, authenticated;
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.store_integration_secret(text, text) from public, anon, authenticated;
revoke all on function public.read_integration_secret(text) from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
grant execute on function public.store_integration_secret(text, text) to service_role;
grant execute on function public.read_integration_secret(text) to service_role;

-- Tabelas exclusivamente administrativas ficam inacessíveis pela API pública.
revoke all on table public.matching_rules from anon, authenticated;
revoke all on table public.checklist_templates from anon, authenticated;
revoke all on table public.checklist_versions from anon, authenticated;
revoke all on table public.checklist_items from anon, authenticated;
revoke all on table public.stripe_events from anon, authenticated;
revoke all on table public.integration_settings from anon, authenticated;
revoke all on table public.rate_limit_buckets from anon, authenticated;
revoke all on table public.duplicate_company_alerts from anon, authenticated;
revoke all on table public.impersonation_sessions from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;
revoke all on table public.delivery_access_attempts from anon, authenticated;
