import { ImpersonationButton } from "@/components/admin/impersonation-button";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export default async function AdminPage() {
  await requireAdminPage(); const admin = createAdminSupabaseClient();
  const [{ data: profiles }, usersResult] = await Promise.all([
    admin.from("profiles").select("user_id,account_id,full_name,professional_type,account:customer_accounts(status,created_at),subscription:customer_accounts(subscriptions(status,cycle_end))").order("created_at", { ascending: false }).limit(50),
    admin.auth.admin.listUsers({ page: 1, perPage: 100 }),
  ]);
  const emails = new Map(usersResult.data.users.map((user) => [user.id, user.email]));
  return <div className="live-page"><div className="live-page-heading"><div><p className="eyebrow">SAAS MULTIUSUÁRIO</p><h1>Profissionais independentes</h1><p>Cada linha representa uma conta isolada. A visualização administrativa é auditada e somente leitura.</p></div><span className="live-account-count">{profiles?.length ?? 0} contas</span></div><section className="live-professionals">{profiles?.map((profile) => { const account = Array.isArray(profile.account) ? profile.account[0] : profile.account; return <article key={profile.account_id}><div className="live-person-avatar">{profile.full_name.split(" ").slice(0, 2).map((word: string) => word[0]).join("")}</div><div><strong>{profile.full_name || "Cadastro em andamento"}</strong><small>{profile.professional_type ?? "Perfil não informado"}</small><span>{emails.get(profile.user_id)}</span></div><b>{account?.status ?? "pending"}</b><ImpersonationButton accountId={profile.account_id} name={profile.full_name || "usuário"}/></article>; })}</section></div>;
}
