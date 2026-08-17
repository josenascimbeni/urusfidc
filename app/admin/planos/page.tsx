import { CouponManager } from "@/components/admin/coupon-manager";
import { PlanManager } from "@/components/admin/plan-manager";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function PlansPage() {
  await requireAdminPage();
  const admin = createAdminSupabaseClient();
  const [{ data: plans }, { data: coupons }, { data: redemptions }] = await Promise.all([
    admin.from("plan_versions").select("*").order("created_at", { ascending: false }),
    admin.from("billing_coupons").select("*").order("created_at", { ascending: false }),
    admin.from("coupon_redemptions").select("coupon_id").eq("status", "applied"),
  ]);
  const counts = new Map<string, number>();
  for (const redemption of redemptions ?? []) counts.set(redemption.coupon_id, (counts.get(redemption.coupon_id) ?? 0) + 1);
  const couponRows = (coupons ?? []).map((coupon) => ({ ...coupon, redemption_count: counts.get(coupon.id) ?? 0 }));
  return <div className="live-page"><PlanManager initialPlans={plans ?? []}/><CouponManager initialCoupons={couponRows}/></div>;
}
