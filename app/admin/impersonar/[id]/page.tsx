import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { EndImpersonationButton } from "@/components/admin/end-impersonation-button";
import { requireAdminPage } from "@/lib/auth/admin-page";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function money(value: number | string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) / 100); }

export default async function ImpersonationPage({ params }: { params: Promise<{ id: string }> }) {
  const context = await requireAdminPage(); const { id } = await params; const admin = createAdminSupabaseClient();
  const activeCookie = (await cookies()).get("urus_impersonation")?.value; const requestHeaders = await headers(); const contextHash = createHash("sha256").update(`${requestHeaders.get("user-agent") ?? ""}|${requestHeaders.get("x-forwarded-for") ?? ""}`).digest("hex");
  const { data: session } = await admin.from("impersonation_sessions").select("id,target_account_id,reason,expires_at,ended_at,context_hash").eq("id", id).eq("admin_user_id", context.user.id).maybeSingle();
  if (!session || activeCookie !== id || session.context_hash !== contextHash || session.ended_at || new Date(session.expires_at) <= new Date()) notFound();
  const [{ data: profile }, { data: operations }, { data: usage }, { data: subscription }] = await Promise.all([
    admin.from("profiles").select("full_name,professional_type").eq("account_id", session.target_account_id).single(),
    admin.from("operations").select("id,public_code,status,amount_cents,created_at,company:companies(legal_name)").eq("account_id", session.target_account_id).order("created_at", { ascending: false }).limit(25),
    admin.from("usage_periods").select("submitted_cases,case_limit").eq("account_id", session.target_account_id).order("cycle_start", { ascending: false }).limit(1).maybeSingle(),
    admin.from("subscriptions").select("status").eq("account_id", session.target_account_id).single(),
  ]);
  return <div className="impersonation-view"><div className="impersonation-banner"><div><strong>Visualizando como {profile?.full_name}</strong><span>Modo somente leitura · expira automaticamente em 30 minutos</span></div><EndImpersonationButton sessionId={id}/></div><div className="live-page"><div className="live-page-heading"><div><p className="eyebrow">EXPERIÊNCIA DO PROFISSIONAL</p><h1>Olá, {profile?.full_name?.split(" ")[0]}.</h1><p>{profile?.professional_type} · Motivo registrado: {session.reason}</p></div></div><div className="live-metrics"><article><small>Casos neste ciclo</small><strong>{usage?.submitted_cases ?? 0}<em>/{usage?.case_limit ?? 100}</em></strong></article><article><small>Operações</small><strong>{operations?.length ?? 0}</strong></article><article><small>Assinatura</small><strong className="live-status-text">{subscription?.status}</strong></article></div><section className="live-table-panel read-only"><header><div><h2>Operações deste profissional</h2><p>Downloads, edições e ações estão bloqueados.</p></div></header>{operations?.map((operation) => { const company = Array.isArray(operation.company) ? operation.company[0] : operation.company; return <div className="read-only-row" key={operation.id}><span>{operation.public_code}</span><strong>{company?.legal_name}</strong><small>{money(operation.amount_cents)}</small><b>{operation.status}</b></div>; })}</section></div></div>;
}
