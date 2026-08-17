import { notFound } from "next/navigation";
import { MatchingButton } from "@/components/operations/matching-button";
import { ManualMatchRequest } from "@/components/operations/manual-match-request";
import { ReportActions } from "@/components/reports/report-actions";
import { requireAccountContext } from "@/lib/auth/context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function money(value: number | string) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) / 100); }

export default async function OperationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAccountContext();
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: operation } = await supabase.from("operations").select("*,company:companies(*)").eq("id", id).maybeSingle();
  if (!operation) notFound();
  const [{ data: matches }, { data: selections }, { data: checklists }] = await Promise.all([
    supabase.from("match_results").select("id,fidc_id,eligible,score,criteria,explanation,fidc_snapshot,created_at").eq("operation_id", id).order("score", { ascending: false }),
    supabase.from("fidc_selections").select("fidc_id,decision").eq("operation_id", id),
    supabase.from("operation_checklists").select("id,fidc_id,fidc:fidcs(name)").eq("operation_id", id),
  ]);
  const company = Array.isArray(operation.company) ? operation.company[0] : operation.company;
  return <div className="live-page"><div className="live-page-heading"><div><p className="eyebrow">{operation.public_code}</p><h1>{company?.legal_name}</h1><p>{company?.segment} · {company?.city}/{company?.state} · {money(operation.amount_cents)}</p></div><div className="operation-heading-actions"><MatchingButton operationId={id} alreadySubmitted={Boolean(operation.matching_submitted_at)} /><ReportActions operationId={id} compact /></div></div><section className="live-operation-summary"><article><small>Faturamento anual</small><strong>{money(company?.annual_revenue_cents ?? 0)}</strong></article><article><small>Modalidade</small><strong>{operation.operation_type}</strong></article><article><small>Garantia</small><strong>{operation.has_guarantee ? `${operation.guarantee_type} · ${money(operation.guarantee_value_cents)}` : "Sem garantia"}</strong></article><article><small>Etapa</small><strong>{operation.status}</strong></article></section><section className="live-match-panel"><header><div><p className="eyebrow">MATCHING EXPLICÁVEL</p><h2>FIDCs avaliados</h2></div><span>{matches?.length ?? 0} resultados</span></header>{matches?.length ? matches.map((match) => { const fidc = match.fidc_snapshot as { name?: string }; const selection = selections?.find((item) => item.fidc_id === match.fidc_id); return <article key={match.id}><strong>{fidc?.name ?? "FIDC"}</strong><span className={match.eligible ? "eligible" : "ineligible"}>{match.eligible ? "Elegível" : "Fora do perfil"}</span><b>{match.score}%</b><p>{match.explanation}</p>{!match.eligible && <ManualMatchRequest operationId={id} fidcId={match.fidc_id} currentDecision={selection?.decision} />}</article>; }) : <div className="live-empty"><strong>Matching ainda não processado</strong><p>O primeiro envio consumirá uma unidade da franquia mensal.</p></div>}</section>{checklists?.length ? <section className="live-table-panel"><header><div><h2>Documentos por FIDC</h2><p>O padrão Urus e as exigências adicionais foram congelados pela Administração.</p></div></header>{checklists.map((checklist) => { const fidc = Array.isArray(checklist.fidc) ? checklist.fidc[0] : checklist.fidc; return <a href={`/portal/operacoes/${id}/documentos?checklist=${checklist.id}`} key={checklist.id}><span>CHECKLIST</span><strong>{fidc?.name ?? "FIDC"}</strong><small>Enviar e acompanhar documentos</small><b>ABRIR</b><i>→</i></a>; })}</section> : null}</div>;
}
