create index billing_coupons_plan_version_idx on public.billing_coupons(plan_version_id) where plan_version_id is not null;
create index billing_coupons_created_by_idx on public.billing_coupons(created_by) where created_by is not null;
create index coupon_redemptions_subscription_idx on public.coupon_redemptions(subscription_id);
