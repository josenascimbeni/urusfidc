create table public.billing_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and code ~ '^[A-Z0-9]{4,32}$'),
  name text not null check (char_length(name) between 3 and 120),
  discount_type text not null default 'percent' check (discount_type in ('percent', 'amount')),
  percent_off numeric(5,2),
  amount_off_cents bigint,
  currency char(3),
  duration text not null default 'once' check (duration in ('once', 'repeating', 'forever')),
  duration_months integer,
  plan_version_id uuid references public.plan_versions(id) on delete restrict,
  max_redemptions integer check (max_redemptions is null or max_redemptions > 0),
  per_account_limit integer not null default 1 check (per_account_limit between 1 and 100),
  redeem_by timestamptz,
  active boolean not null default true,
  test_only boolean not null default false,
  stripe_coupon_id text unique,
  stripe_promotion_code_id text unique,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (discount_type = 'percent' and percent_off > 0 and percent_off <= 100 and amount_off_cents is null and currency is null)
    or
    (discount_type = 'amount' and percent_off is null and amount_off_cents > 0 and currency ~ '^[A-Z]{3}$')
  ),
  check (
    (duration = 'repeating' and duration_months between 1 and 36)
    or
    (duration <> 'repeating' and duration_months is null)
  )
);

create table public.coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references public.billing_coupons(id) on delete restrict,
  account_id uuid not null references public.customer_accounts(id) on delete cascade,
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_subscription_id text,
  status text not null default 'reserved' check (status in ('reserved', 'applied', 'expired', 'cancelled')),
  reserved_until timestamptz not null default (now() + interval '30 minutes'),
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index billing_coupons_active_code_idx on public.billing_coupons(code) where active;
create index coupon_redemptions_coupon_status_idx on public.coupon_redemptions(coupon_id, status);
create index coupon_redemptions_account_created_idx on public.coupon_redemptions(account_id, created_at desc);

create trigger billing_coupons_updated_at
before update on public.billing_coupons
for each row execute function public.set_updated_at();

create trigger coupon_redemptions_updated_at
before update on public.coupon_redemptions
for each row execute function public.set_updated_at();

alter table public.billing_coupons enable row level security;
alter table public.coupon_redemptions enable row level security;

revoke all on public.billing_coupons from anon, authenticated;
revoke all on public.coupon_redemptions from anon, authenticated;

create policy coupon_redemptions_account_read
on public.coupon_redemptions
for select
to authenticated
using (account_id = public.current_account_id());

create trigger prevent_coupon_redemption_account_change
before update on public.coupon_redemptions
for each row execute function public.prevent_account_change();

insert into public.billing_coupons (
  code,
  name,
  discount_type,
  percent_off,
  duration,
  max_redemptions,
  per_account_limit,
  active,
  test_only
)
values (
  'URUS100TESTE',
  'Teste Urus — 100% na primeira mensalidade',
  'percent',
  100,
  'once',
  100,
  1,
  true,
  true
)
on conflict (code) do nothing;

create or replace function public.reserve_billing_coupon(
  coupon_code text,
  target_account_id uuid,
  target_subscription_id uuid,
  stripe_livemode boolean
)
returns table (
  result_coupon_id uuid,
  result_redemption_id uuid,
  result_stripe_promotion_code_id text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_coupon public.billing_coupons%rowtype;
  existing_redemption public.coupon_redemptions%rowtype;
  total_uses integer;
  account_uses integer;
  new_redemption_id uuid;
begin
  if not exists (
    select 1
    from public.subscriptions
    where id = target_subscription_id
      and account_id = target_account_id
  ) then
    raise exception 'subscription_not_found';
  end if;

  select * into selected_coupon
  from public.billing_coupons
  where code = upper(trim(coupon_code))
  for update;

  if selected_coupon.id is null or not selected_coupon.active then
    raise exception 'coupon_invalid';
  end if;
  if selected_coupon.redeem_by is not null and selected_coupon.redeem_by <= now() then
    raise exception 'coupon_expired';
  end if;
  if selected_coupon.test_only and stripe_livemode then
    raise exception 'coupon_test_only';
  end if;
  if selected_coupon.stripe_promotion_code_id is null then
    raise exception 'coupon_not_synchronized';
  end if;
  if selected_coupon.plan_version_id is not null and not exists (
    select 1
    from public.subscriptions
    where id = target_subscription_id
      and plan_version_id = selected_coupon.plan_version_id
  ) then
    raise exception 'coupon_plan_ineligible';
  end if;

  select * into existing_redemption
  from public.coupon_redemptions
  where coupon_id = selected_coupon.id
    and account_id = target_account_id
    and status = 'reserved'
    and reserved_until > now()
  order by created_at desc
  limit 1;

  if existing_redemption.id is not null then
    return query select selected_coupon.id, existing_redemption.id, selected_coupon.stripe_promotion_code_id;
    return;
  end if;

  update public.coupon_redemptions
  set status = 'expired'
  where coupon_id = selected_coupon.id
    and status = 'reserved'
    and reserved_until <= now();

  select count(*) into total_uses
  from public.coupon_redemptions
  where coupon_id = selected_coupon.id
    and status in ('reserved', 'applied');

  if selected_coupon.max_redemptions is not null and total_uses >= selected_coupon.max_redemptions then
    raise exception 'coupon_limit_reached';
  end if;

  select count(*) into account_uses
  from public.coupon_redemptions
  where coupon_id = selected_coupon.id
    and account_id = target_account_id
    and status in ('reserved', 'applied');

  if account_uses >= selected_coupon.per_account_limit then
    raise exception 'coupon_account_limit_reached';
  end if;

  insert into public.coupon_redemptions (coupon_id, account_id, subscription_id)
  values (selected_coupon.id, target_account_id, target_subscription_id)
  returning id into new_redemption_id;

  return query select selected_coupon.id, new_redemption_id, selected_coupon.stripe_promotion_code_id;
end;
$$;

revoke all on function public.reserve_billing_coupon(text, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.reserve_billing_coupon(text, uuid, uuid, boolean) to service_role;
