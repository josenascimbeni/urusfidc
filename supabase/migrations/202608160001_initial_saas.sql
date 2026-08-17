create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;

create table public.plan_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version integer not null check (version > 0),
  price_cents bigint not null check (price_cents >= 0),
  monthly_case_limit integer not null check (monthly_case_limit > 0),
  stripe_price_id text unique,
  status text not null default 'active' check (status in ('active', 'archived')),
  effective_from timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (name, version)
);

insert into public.plan_versions (id, name, version, price_cents, monthly_case_limit, status)
values ('10000000-0000-4000-8000-000000000001', 'Urus 100', 1, 9900, 100, 'active')
on conflict (id) do nothing;

create table public.customer_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'pending_subscription' check (status in ('pending_subscription', 'active', 'past_due', 'suspended', 'cancelled', 'platform')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_id uuid not null unique references public.customer_accounts(id) on delete cascade,
  full_name text not null default '',
  professional_type text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'professional' check (role in ('professional', 'admin')),
  created_at timestamptz not null default now()
);

create table public.billing_profiles (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.customer_accounts(id) on delete cascade,
  person_type text check (person_type in ('individual', 'company')),
  tax_id text,
  legal_name text,
  postal_code text,
  address_line1 text,
  address_line2 text,
  city text,
  state char(2),
  country char(2) not null default 'BR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.privacy_consents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  document_type text not null,
  document_version text not null,
  accepted_at timestamptz not null default now(),
  ip_hash text,
  unique (account_id, document_type, document_version)
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null unique references public.customer_accounts(id) on delete cascade,
  plan_version_id uuid not null references public.plan_versions(id),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  status text not null default 'pending' check (status in ('pending', 'incomplete', 'active', 'past_due', 'unpaid', 'cancelled')),
  cycle_start timestamptz not null default now(),
  cycle_end timestamptz not null default (now() + interval '1 month'),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.usage_periods (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  cycle_start timestamptz not null,
  cycle_end timestamptz not null,
  submitted_cases integer not null default 0 check (submitted_cases >= 0),
  case_limit integer not null check (case_limit > 0),
  created_at timestamptz not null default now(),
  unique (subscription_id, cycle_start)
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  cnpj char(14) not null check (cnpj ~ '^[0-9]{14}$'),
  legal_name text not null,
  segment text not null,
  annual_revenue_cents bigint not null check (annual_revenue_cents >= 0),
  city text not null,
  state char(2) not null,
  registry_source text,
  registry_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, cnpj)
);

create table public.operations (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique default ('OP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  status text not null default 'qualification' check (status in ('qualification', 'urus_review', 'documents', 'analysis', 'approved', 'denied', 'closed')),
  amount_cents bigint not null check (amount_cents > 0),
  operation_type text not null,
  has_guarantee boolean not null default false,
  guarantee_value_cents bigint not null default 0 check (guarantee_value_cents >= 0),
  guarantee_type text,
  sales_method text not null,
  receipt_method text not null,
  matching_submitted_at timestamptz,
  closed_at timestamptz,
  retention_due_at timestamptz,
  legal_hold boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (has_guarantee or (guarantee_value_cents = 0 and guarantee_type is null))
);

create table public.operation_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  event_type text not null,
  actor_user_id uuid references auth.users(id),
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.fidcs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  distribution_email text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'inactive', 'archived')),
  min_revenue_cents bigint not null default 0,
  max_revenue_cents bigint,
  revenue_mode text not null default 'minimum' check (revenue_mode in ('minimum', 'maximum', 'range', 'score_only')),
  revenue_required boolean not null default true,
  segments text[] not null default '{}',
  operation_types text[] not null default '{}',
  regions text[] not null default '{}',
  weights jsonb not null default '{"revenue":25,"segment":20,"operation":35,"region":20}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.matching_rules (
  id uuid primary key default gen_random_uuid(),
  fidc_id uuid not null references public.fidcs(id) on delete cascade,
  criterion text not null,
  operator text not null,
  required boolean not null default false,
  weight integer not null default 0 check (weight between 0 and 100),
  config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.match_runs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  input_snapshot jsonb not null,
  rules_version text not null,
  created_at timestamptz not null default now()
);

create table public.match_results (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  match_run_id uuid not null references public.match_runs(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  eligible boolean not null,
  score integer not null check (score between 0 and 100),
  criteria jsonb not null,
  explanation text not null,
  fidc_snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (match_run_id, fidc_id)
);

create table public.fidc_selections (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  origin text not null check (origin in ('automatic', 'manual_request')),
  decision text not null default 'requested' check (decision in ('suggested', 'requested', 'approved', 'rejected')),
  reason text,
  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now(),
  decided_by uuid references auth.users(id),
  decided_at timestamptz,
  unique (operation_id, fidc_id)
);

create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  fidc_id uuid references public.fidcs(id) on delete cascade,
  name text not null,
  scope text not null check (scope in ('urus_standard', 'fidc_additional')),
  status text not null default 'active' check (status in ('active', 'archived')),
  active_version integer not null default 1,
  created_at timestamptz not null default now(),
  unique nulls not distinct (scope, fidc_id)
);

create table public.checklist_versions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  version integer not null check (version > 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (template_id, version)
);

create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.checklist_versions(id) on delete cascade,
  stable_key text not null,
  name text not null,
  detail text not null,
  instructions text not null,
  required boolean not null,
  multiplicity text not null check (multiplicity in ('single', 'per_year', 'per_partner')),
  validity_days integer,
  allowed_mime_types text[] not null,
  max_size_mb integer not null default 25 check (max_size_mb between 1 and 25),
  expected_evidence text[] not null default '{}',
  ai_standard text not null,
  active boolean not null default true,
  sort_order integer not null,
  unique (version_id, stable_key)
);

create table public.operation_checklists (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  standard_version_id uuid not null references public.checklist_versions(id),
  additional_version_id uuid references public.checklist_versions(id),
  frozen_at timestamptz not null default now(),
  unique (operation_id, fidc_id)
);

create table public.checklist_requirements (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_checklist_id uuid not null references public.operation_checklists(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  source_item_id uuid not null references public.checklist_items(id),
  item_snapshot jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'uploaded', 'analyzing', 'review_required', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table public.uploaded_documents (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  storage_bucket text not null default 'documents',
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 26214400),
  sha256 text not null,
  malware_scan_status text not null default 'not_configured' check (malware_scan_status in ('not_configured', 'pending', 'clean', 'infected', 'failed')),
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.document_requirement_links (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  document_id uuid not null references public.uploaded_documents(id) on delete cascade,
  requirement_id uuid not null references public.checklist_requirements(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (document_id, requirement_id)
);

create table public.ai_reviews (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  document_id uuid not null references public.uploaded_documents(id) on delete cascade,
  requirement_id uuid not null references public.checklist_requirements(id) on delete cascade,
  status text not null check (status in ('queued', 'processing', 'completed', 'failed')),
  result jsonb,
  model text,
  prompt_version text,
  input_tokens integer,
  output_tokens integer,
  cost_microusd bigint,
  error_code text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.human_document_decisions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  requirement_id uuid not null references public.checklist_requirements(id) on delete cascade,
  ai_review_id uuid references public.ai_reviews(id),
  decision text not null check (decision in ('approved', 'rejected')),
  reason text,
  decided_by uuid not null references auth.users(id),
  decided_at timestamptz not null default now()
);

create table public.distribution_packages (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  status text not null default 'preparing' check (status in ('preparing', 'ready', 'sent', 'expired')),
  manifest jsonb not null default '{}'::jsonb,
  authorized_by uuid references auth.users(id),
  authorized_at timestamptz,
  created_at timestamptz not null default now(),
  unique (operation_id, fidc_id)
);

create table public.secure_deliveries (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  package_id uuid not null references public.distribution_packages(id) on delete cascade,
  recipient_email text not null,
  link_token_hash text not null unique,
  otp_hash text,
  otp_expires_at timestamptz,
  failed_attempts integer not null default 0,
  expires_at timestamptz not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'accessed', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  accessed_at timestamptz
);

create table public.delivery_access_attempts (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.secure_deliveries(id) on delete cascade,
  outcome text not null,
  ip_hash text,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  scheduled_at timestamptz not null,
  meeting_url text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.committee_decisions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  decision text not null check (decision in ('pending', 'approved', 'denied')),
  notes text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  fidc_id uuid not null references public.fidcs(id),
  approved_amount_cents bigint not null,
  monthly_rate numeric(8,4),
  term_months integer,
  fees_cents bigint not null default 0,
  validity_date date,
  conditions jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'denied')),
  created_at timestamptz not null default now()
);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  amount_cents bigint not null check (amount_cents >= 0),
  status text not null default 'awaiting_fidc' check (status in ('awaiting_fidc', 'received_by_urus', 'paid_to_professional')),
  proof_document_id uuid references public.uploaded_documents(id),
  updated_at timestamptz not null default now()
);

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  operation_id uuid not null references public.operations(id) on delete cascade,
  event_type text not null check (event_type in ('first_matching_submission')),
  created_at timestamptz not null default now(),
  unique (operation_id, event_type)
);

create table public.stripe_events (
  event_id text primary key,
  event_type text not null,
  livemode boolean not null,
  payload jsonb not null,
  status text not null default 'processing' check (status in ('processing', 'processed', 'failed')),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.customer_accounts(id) on delete cascade,
  operation_id uuid references public.operations(id) on delete cascade,
  audience text not null check (audience in ('professional', 'urus', 'fidc')),
  recipient text,
  template_key text not null,
  safe_payload jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  status text not null default 'queued' check (status in ('queued', 'processing', 'sent', 'failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.exports (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  operation_id uuid references public.operations(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  export_type text not null,
  storage_path text,
  status text not null default 'queued' check (status in ('queued', 'processing', 'ready', 'failed', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.integration_settings (
  id uuid primary key default gen_random_uuid(),
  provider text not null unique,
  vault_secret_id uuid,
  config jsonb not null default '{}'::jsonb,
  masked_hint text,
  validated_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table public.rate_limit_buckets (
  bucket_key text primary key,
  request_count integer not null default 0,
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.duplicate_company_alerts (
  id uuid primary key default gen_random_uuid(),
  cnpj_hash text not null,
  first_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  second_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create table public.impersonation_sessions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  target_account_id uuid not null references public.customer_accounts(id) on delete cascade,
  reason text not null check (char_length(reason) between 10 and 500),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  ended_at timestamptz,
  context_hash text,
  check (expires_at <= started_at + interval '30 minutes')
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  account_id uuid references public.customer_accounts(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  safe_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index customer_accounts_owner_idx on public.customer_accounts(owner_user_id);
create index operations_account_created_idx on public.operations(account_id, created_at desc);
create index operations_account_status_idx on public.operations(account_id, status);
create index companies_account_cnpj_idx on public.companies(account_id, cnpj);
create index operation_events_operation_created_idx on public.operation_events(operation_id, created_at desc);
create index match_results_operation_idx on public.match_results(operation_id, score desc);
create index fidc_selections_operation_idx on public.fidc_selections(operation_id, fidc_id);
create index checklist_requirements_operation_fidc_idx on public.checklist_requirements(operation_id, fidc_id);
create index uploaded_documents_account_operation_idx on public.uploaded_documents(account_id, operation_id);
create index notifications_account_created_idx on public.notification_outbox(account_id, created_at desc);
create index usage_periods_subscription_cycle_idx on public.usage_periods(subscription_id, cycle_start desc);
create index audit_logs_account_created_idx on public.audit_logs(account_id, created_at desc);

create or replace function public.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.customer_accounts where owner_user_id = auth.uid() limit 1
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.user_roles where user_id = auth.uid() and role = 'admin')
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_account_change()
returns trigger language plpgsql as $$
begin
  if new.account_id is distinct from old.account_id then
    raise exception 'account_id is immutable';
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_account_id uuid;
  new_subscription_id uuid;
  default_plan public.plan_versions%rowtype;
begin
  select * into default_plan from public.plan_versions where status = 'active' order by effective_from desc limit 1;
  insert into public.customer_accounts (owner_user_id) values (new.id) returning id into new_account_id;
  insert into public.profiles (user_id, account_id, full_name, professional_type)
  values (new.id, new_account_id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.raw_user_meta_data->>'professional_type');
  insert into public.user_roles (user_id, role) values (new.id, 'professional');
  if new.raw_user_meta_data->>'privacy_terms_version' is not null then
    insert into public.privacy_consents(account_id, document_type, document_version)
    values (new_account_id, 'terms_and_privacy', new.raw_user_meta_data->>'privacy_terms_version');
  end if;
  insert into public.subscriptions (account_id, plan_version_id, status)
  values (new_account_id, default_plan.id, 'pending') returning id into new_subscription_id;
  insert into public.usage_periods (account_id, subscription_id, cycle_start, cycle_end, case_limit)
  values (new_account_id, new_subscription_id, now(), now() + interval '1 month', default_plan.monthly_case_limit);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create trigger customer_accounts_updated_at before update on public.customer_accounts for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger billing_profiles_updated_at before update on public.billing_profiles for each row execute function public.set_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions for each row execute function public.set_updated_at();
create trigger companies_updated_at before update on public.companies for each row execute function public.set_updated_at();
create trigger operations_updated_at before update on public.operations for each row execute function public.set_updated_at();
create trigger fidcs_updated_at before update on public.fidcs for each row execute function public.set_updated_at();

do $$
declare
  table_name text;
  account_tables text[] := array[
    'billing_profiles','privacy_consents','subscriptions','usage_periods','companies','operations','operation_events',
    'match_runs','match_results','fidc_selections','operation_checklists','checklist_requirements','uploaded_documents',
    'document_requirement_links','ai_reviews','human_document_decisions','distribution_packages','secure_deliveries',
    'meetings','committee_decisions','proposals','commissions','usage_events','notification_outbox','exports'
  ];
begin
  foreach table_name in array account_tables loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('create policy account_isolation_read on public.%I for select to authenticated using (account_id = public.current_account_id())', table_name);
    execute format('revoke insert, update, delete, truncate on public.%I from anon, authenticated', table_name);
    execute format('create trigger prevent_account_change before update on public.%I for each row execute function public.prevent_account_change()', table_name);
  end loop;
end $$;

alter table public.customer_accounts enable row level security;
create policy own_account on public.customer_accounts for select to authenticated using (owner_user_id = auth.uid());

alter table public.profiles enable row level security;
create policy own_profile on public.profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and account_id = public.current_account_id());

alter table public.user_roles enable row level security;
create policy own_role on public.user_roles for select to authenticated using (user_id = auth.uid());

alter table public.plan_versions enable row level security;
create policy active_plans_read on public.plan_versions for select to authenticated using (status = 'active');

alter table public.fidcs enable row level security;
create policy active_fidcs_read on public.fidcs for select to authenticated using (status = 'active');
alter table public.matching_rules enable row level security;
alter table public.checklist_templates enable row level security;
alter table public.checklist_versions enable row level security;
alter table public.checklist_items enable row level security;
alter table public.stripe_events enable row level security;
alter table public.integration_settings enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.duplicate_company_alerts enable row level security;
alter table public.impersonation_sessions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.delivery_access_attempts enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('documents', 'documents', false, 26214400, array['application/pdf','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/csv','image/jpeg','image/png']),
  ('exports', 'exports', false, 52428800, array['application/pdf','application/zip','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false;

-- Não há políticas de acesso direto aos buckets. Uploads e downloads usam URLs
-- assinadas individualmente pelo backend após validação de conta e finalidade.

create or replace function public.consume_first_matching_case(target_operation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  account uuid := public.current_account_id();
  sub public.subscriptions%rowtype;
  usage public.usage_periods%rowtype;
begin
  if account is null then raise exception 'not_authenticated'; end if;
  if not exists(select 1 from public.operations where id = target_operation_id and account_id = account) then raise exception 'operation_not_found'; end if;
  if exists(select 1 from public.usage_events where operation_id = target_operation_id and event_type = 'first_matching_submission') then return false; end if;
  select * into sub from public.subscriptions where account_id = account for update;
  if sub.status <> 'active' then raise exception 'subscription_inactive'; end if;
  select * into usage from public.usage_periods where subscription_id = sub.id and now() >= cycle_start and now() < cycle_end order by cycle_start desc limit 1 for update;
  if usage.id is null or usage.submitted_cases >= usage.case_limit then raise exception 'case_limit_reached'; end if;
  update public.usage_periods set submitted_cases = submitted_cases + 1 where id = usage.id;
  insert into public.usage_events(account_id, subscription_id, operation_id, event_type) values (account, sub.id, target_operation_id, 'first_matching_submission');
  update public.operations set matching_submitted_at = coalesce(matching_submitted_at, now()) where id = target_operation_id;
  return true;
end;
$$;

revoke all on function public.consume_first_matching_case(uuid) from public;
grant execute on function public.consume_first_matching_case(uuid) to authenticated;

create or replace function public.reject_audit_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_logs are append-only';
end;
$$;

create trigger audit_logs_append_only before update or delete on public.audit_logs
for each row execute function public.reject_audit_mutation();

create or replace function public.consume_rate_limit(target_key text, maximum_requests integer, window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_bucket public.rate_limit_buckets%rowtype;
begin
  insert into public.rate_limit_buckets(bucket_key, request_count) values (target_key, 0)
  on conflict (bucket_key) do nothing;
  select * into current_bucket from public.rate_limit_buckets where bucket_key = target_key for update;
  if current_bucket.window_started_at + make_interval(secs => window_seconds) <= now() then
    update public.rate_limit_buckets set request_count = 1, window_started_at = now(), updated_at = now() where bucket_key = target_key;
    return true;
  end if;
  if current_bucket.request_count >= maximum_requests then return false; end if;
  update public.rate_limit_buckets set request_count = request_count + 1, updated_at = now() where bucket_key = target_key;
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function public.store_integration_secret(provider_name text, secret_value text)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  old_secret_id uuid;
  new_secret_id uuid;
begin
  select vault_secret_id into old_secret_id from public.integration_settings where provider = provider_name;
  if old_secret_id is not null then delete from vault.secrets where id = old_secret_id; end if;
  select vault.create_secret(secret_value, provider_name || '_' || gen_random_uuid()::text, 'Segredo gerenciado pela interface administrativa da Urus') into new_secret_id;
  return new_secret_id;
end;
$$;

create or replace function public.read_integration_secret(provider_name text)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets
  where id = (select vault_secret_id from public.integration_settings where provider = provider_name)
  limit 1
$$;

revoke all on function public.store_integration_secret(text,text) from public, authenticated;
revoke all on function public.read_integration_secret(text) from public, authenticated;
grant execute on function public.store_integration_secret(text,text) to service_role;
grant execute on function public.read_integration_secret(text) to service_role;
