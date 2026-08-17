import { IntegrationSettings } from "@/components/admin/integration-settings";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function IntegrationsPage() { await requireAdminPage(); const admin = createAdminSupabaseClient(); const { data } = await admin.from("integration_settings").select("provider,config,masked_hint,validated_at").eq("provider", "openrouter").maybeSingle(); return <div className="live-page"><IntegrationSettings initial={data} /></div>; }
