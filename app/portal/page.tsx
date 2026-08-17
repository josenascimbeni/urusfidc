import Link from "next/link";
import { MetaPurchase } from "@/components/analytics/meta-purchase";
import { BillingSetup } from "@/components/billing/billing-setup";
import { ReportActions } from "@/components/reports/report-actions";
import { requireAccountContext } from "@/lib/auth/context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function money(cents: number | string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(cents) / 100); }

export default async function PortalPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: checkoutSessionId } = await searchParams;
  const context = await requireAccountContext();
  const supabase = await createServerSupabaseClient();
  const [{ data: subscription }, { data: usage }, { data: operations }, { data: billingProfile }] = await Promise.all([
    supabase.from("subscriptions").select("status,stripe_customer_id,stripe_subscription_id,cycle_end,access_source,plan:plan_versions(name,price_cents,monthly_case_limit)").single(),
    supabase.from("usage_periods").select("submitted_cases,case_limit,cycle_end").order("cycle_start", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("operations").select("id,public_code,status,amount_cents,created_at,company:companies(legal_name)").order("created_at", { ascending: false }).limit(8),
    supabase.from("billing_profiles").select("id").maybeSingle(),
  ]);
  const active = context.subscriptionStatus === "active";
  const promotionalAccess = active && subscription?.access_source === "coupon";
  const statusLabel = promotionalAccess && subscription?.cycle_end
    ? `Acesso parceiro até ${new Intl.DateTimeFormat("pt-BR").format(new Date(subscription.cycle_end))}`
    : active ? "Ativa" : "Pendente";
  return <div className="live-page"><MetaPurchase sessionId={checkoutSessionId} /><div className="live-page-heading"><div><p className="eyebrow">CONTA INDEPENDENTE</p><h1>Olá, {String(context.user.user_metadata.full_name ?? "profissional").split(" ")[0]}.</h1><p>Somente você e a equipe autorizada da Urus podem acessar estes dados.</p></div>{active && <Link className="live-primary-link" href="/portal/nova-operacao">＋ Nova operação</Link>}</div>{!active && <section className="live-subscription-gate"><span>URS 100</span><div><p className="eyebrow">ASSINATURA NECESSÁRIA</p><h2>Ative seu ambiente operacional</h2><p>R$ 99 por mês para cadastrar até 100 novos casos. Seu acesso aos dados existentes permanece disponível mesmo se a assinatura for interrompida.</p></div><BillingSetup initialComplete={Boolean(billingProfile)} hasCustomer={Boolean(subscription?.stripe_subscription_id)} /></section>}<div className="live-metrics"><article><small>Casos neste ciclo</small><strong>{usage?.submitted_cases ?? 0}<em>/{usage?.case_limit ?? 100}</em></strong></article><article><small>Operações cadastradas</small><strong>{operations?.length ?? 0}</strong></article><article><small>Status da assinatura</small><strong className="live-status-text">{statusLabel}</strong></article></div><section className="portal-report-strip"><div><p className="eyebrow">RELATÓRIOS DA CONTA</p><h2>Exportações seguras</h2></div><ReportActions /></section><section className="live-table-panel"><header><div><h2>Suas operações</h2><p>Esta lista é protegida pelo identificador exclusivo da sua conta.</p></div></header>{operations?.length ? operations.map((operation) => { const company = Array.isArray(operation.company) ? operation.company[0] : operation.company; return <Link href={`/portal/operacoes/${operation.id}`} key={operation.id}><span>{operation.public_code}</span><strong>{company?.legal_name ?? "Empresa"}</strong><small>{money(operation.amount_cents)}</small><b>{operation.status}</b><i>→</i></Link>; }) : <div className="live-empty"><strong>Nenhuma operação cadastrada</strong><p>{active ? "Cadastre seu primeiro caso para iniciar o matching." : "Ative a assinatura para começar."}</p></div>}</section></div>;
}
