import { OperationQueue } from "@/components/admin/operation-queue";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function AdminOperationsPage() {
  await requireAdminPage(); const admin = createAdminSupabaseClient();
  const [{ data: operations }, { data: selections }, { data: requirements }, { data: profiles }] = await Promise.all([
    admin.from("operations").select("id,public_code,account_id,status,created_at,company:companies(legal_name)").order("created_at", { ascending: false }).limit(100),
    admin.from("fidc_selections").select("id,operation_id,fidc_id,origin,decision,reason,fidc:fidcs(name)").order("requested_at", { ascending: false }).limit(500),
    admin.from("checklist_requirements").select("id,operation_id,fidc_id,status,item_snapshot,fidc:fidcs(name),ai_reviews(status,result,created_at)").in("status", ["analyzing", "review_required", "approved", "rejected"]).order("created_at", { ascending: false }).limit(500),
    admin.from("profiles").select("account_id,full_name"),
  ]);
  const accountNames = Object.fromEntries((profiles ?? []).map((profile) => [profile.account_id, profile.full_name]));
  return <div className="live-page"><OperationQueue operations={operations ?? []} initialSelections={selections ?? []} initialRequirements={requirements ?? []} accountNames={accountNames} /></div>;
}
