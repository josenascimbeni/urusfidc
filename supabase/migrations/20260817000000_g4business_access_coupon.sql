alter table public.billing_coupons
  add column payment_bypass boolean not null default false,
  add column access_duration_days integer;

alter table public.billing_coupons
  add constraint billing_coupons_payment_bypass_check check (
    (
      payment_bypass
      and access_duration_days between 1 and 365
      and discount_type = 'percent'
      and percent_off = 100
      and stripe_coupon_id is null
      and stripe_promotion_code_id is null
    )
    or (not payment_bypass and access_duration_days is null)
  );

alter table public.coupon_redemptions
  add column access_expires_at timestamptz;

alter table public.subscriptions
  add column access_source text not null default 'stripe'
  check (access_source in ('stripe', 'coupon'));

insert into public.billing_coupons (
  code,
  name,
  discount_type,
  percent_off,
  duration,
  max_redemptions,
  per_account_limit,
  redeem_by,
  active,
  test_only,
  payment_bypass,
  access_duration_days,
  stripe_coupon_id,
  stripe_promotion_code_id
)
values (
  'G4BUSINESS',
  'G4Business — acesso gratuito por 30 dias',
  'percent',
  100,
  'once',
  null,
  1,
  now() + interval '30 days',
  true,
  false,
  true,
  30,
  null,
  null
)
on conflict (code) do update set
  name = excluded.name,
  discount_type = excluded.discount_type,
  percent_off = excluded.percent_off,
  duration = excluded.duration,
  duration_months = null,
  max_redemptions = null,
  per_account_limit = 1,
  redeem_by = excluded.redeem_by,
  active = true,
  test_only = false,
  payment_bypass = true,
  access_duration_days = 30,
  stripe_coupon_id = null,
  stripe_promotion_code_id = null,
  updated_at = now();

create or replace function public.activate_access_coupon(
  coupon_code text,
  target_account_id uuid,
  target_subscription_id uuid
)
returns table (
  result_coupon_id uuid,
  result_redemption_id uuid,
  result_access_expires_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  selected_coupon public.billing_coupons%rowtype;
  selected_subscription public.subscriptions%rowtype;
  existing_redemption public.coupon_redemptions%rowtype;
  plan_case_limit integer;
  total_uses integer;
  account_uses integer;
  new_redemption_id uuid;
  access_expires_at timestamptz;
begin
  select * into selected_coupon
  from public.billing_coupons
  where code = upper(trim(coupon_code))
  for update;

  if selected_coupon.id is null or not selected_coupon.active then
    raise exception 'coupon_invalid';
  end if;
  if not selected_coupon.payment_bypass or selected_coupon.access_duration_days is null then
    raise exception 'coupon_not_access_grant';
  end if;
  if selected_coupon.redeem_by is not null and selected_coupon.redeem_by <= now() then
    raise exception 'coupon_expired';
  end if;

  select * into selected_subscription
  from public.subscriptions
  where id = target_subscription_id
    and account_id = target_account_id
  for update;

  if selected_subscription.id is null then
    raise exception 'subscription_not_found';
  end if;
  if selected_subscription.stripe_subscription_id is not null then
    raise exception 'coupon_subscription_conflict';
  end if;

  select * into existing_redemption
  from public.coupon_redemptions
  where coupon_id = selected_coupon.id
    and account_id = target_account_id
    and status = 'applied'
  order by created_at desc
  limit 1;

  if existing_redemption.id is not null and existing_redemption.access_expires_at > now() then
    return query select selected_coupon.id, existing_redemption.id, existing_redemption.access_expires_at;
    return;
  end if;

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

  access_expires_at := now() + make_interval(days => selected_coupon.access_duration_days);

  insert into public.coupon_redemptions (
    coupon_id,
    account_id,
    subscription_id,
    status,
    applied_at,
    access_expires_at
  )
  values (
    selected_coupon.id,
    target_account_id,
    target_subscription_id,
    'applied',
    now(),
    access_expires_at
  )
  returning id into new_redemption_id;

  update public.subscriptions
  set status = 'active',
      access_source = 'coupon',
      cycle_start = now(),
      cycle_end = access_expires_at,
      current_period_end = access_expires_at
  where id = target_subscription_id;

  update public.customer_accounts
  set status = 'active'
  where id = target_account_id;

  select monthly_case_limit into plan_case_limit
  from public.plan_versions
  where id = selected_subscription.plan_version_id;

  insert into public.usage_periods (
    account_id,
    subscription_id,
    cycle_start,
    cycle_end,
    case_limit
  )
  values (
    target_account_id,
    target_subscription_id,
    now(),
    access_expires_at,
    coalesce(plan_case_limit, 100)
  );

  insert into public.audit_logs (
    account_id,
    action,
    entity_type,
    entity_id,
    safe_metadata
  )
  values (
    target_account_id,
    'billing.access_coupon_applied',
    'billing_coupon',
    selected_coupon.id::text,
    jsonb_build_object(
      'code', selected_coupon.code,
      'accessDays', selected_coupon.access_duration_days,
      'accessExpiresAt', access_expires_at
    )
  );

  return query select selected_coupon.id, new_redemption_id, access_expires_at;
end;
$$;

revoke all on function public.activate_access_coupon(text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.activate_access_coupon(text, uuid, uuid) to service_role;
