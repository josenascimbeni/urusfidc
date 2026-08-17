import { FidcManager } from "@/components/admin/fidc-manager";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function AdminFidcsPage() { await requireAdminPage(); const admin = createAdminSupabaseClient(); const [{ data: fidcs }, { data: templates }] = await Promise.all([admin.from("fidcs").select("id,name,status,distribution_email,min_revenue_cents,segments,operation_types,regions").order("name"), admin.from("checklist_templates").select("id,name,scope").eq("status", "active").order("name")]); return <div className="live-page"><FidcManager initialFidcs={(fidcs ?? []) as never[]} templates={(templates ?? []) as never[]}/></div>; }
