import { ReportActions } from "@/components/reports/report-actions";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function AdminReportsPage() {
  await requireAdminPage(); const admin = createAdminSupabaseClient(); const [{ data: profiles }, { data: operations }] = await Promise.all([admin.from("profiles").select("account_id,full_name,professional_type").order("full_name"), admin.from("operations").select("id,account_id,public_code,company:companies(legal_name)").order("created_at", { ascending: false }).limit(100)]);
  return <div className="live-page"><div className="live-page-heading"><div><p className="eyebrow">EXPORTAÇÃO SEGURA</p><h1>Relatórios</h1><p>Cada arquivo é filtrado pela conta selecionada, fica privado e expira em 24 horas.</p></div></div><section className="admin-report-list">{(profiles ?? []).map((profile) => <article key={profile.account_id}><header><div><strong>{profile.full_name}</strong><small>{profile.professional_type}</small></div><ReportActions accountId={profile.account_id} compact /></header><div>{(operations ?? []).filter((operation) => operation.account_id === profile.account_id).map((operation) => { const company = Array.isArray(operation.company) ? operation.company[0] : operation.company; return <section key={operation.id}><span><b>{operation.public_code}</b>{company?.legal_name}</span><ReportActions accountId={profile.account_id} operationId={operation.id} compact /></section>; })}</div></article>)}</section></div>;
}
