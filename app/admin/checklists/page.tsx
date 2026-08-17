import { ChecklistManager } from "@/components/admin/checklist-manager";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function ChecklistsPage() {
  await requireAdminPage();
  const admin = createAdminSupabaseClient();
  const { data: templates } = await admin.from("checklist_templates").select("id,name,scope,fidc_id,active_version,status,fidc:fidcs(name)").eq("status", "active").order("scope").order("name");
  const hydrated = await Promise.all((templates ?? []).map(async (template) => {
    const { data: version } = await admin.from("checklist_versions").select("id").eq("template_id", template.id).eq("version", template.active_version).maybeSingle();
    const { data: items } = version ? await admin.from("checklist_items").select("stable_key,name,detail,required,multiplicity,max_size_mb").eq("version_id", version.id).eq("active", true).order("sort_order") : { data: [] };
    return { ...template, items: items ?? [] };
  }));
  return <div className="live-page"><ChecklistManager initialTemplates={hydrated} /></div>;
}
