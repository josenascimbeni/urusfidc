import { notFound } from "next/navigation";
import { DocumentUploader } from "@/components/operations/document-uploader";
import { requireAccountContext } from "@/lib/auth/context";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DocumentsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ checklist?: string }> }) {
  const context = await requireAccountContext(); const { id } = await params; const { checklist } = await searchParams; const supabase = await createServerSupabaseClient();
  const { data: operation } = await supabase.from("operations").select("id,public_code,company:companies(legal_name)").eq("id", id).maybeSingle();
  if (!operation || !checklist) notFound();
  const { data: frozen } = await supabase.from("operation_checklists").select("id,fidc:fidcs(name)").eq("id", checklist).eq("operation_id", id).maybeSingle();
  if (!frozen) notFound();
  const { data: requirements } = await supabase.from("checklist_requirements").select("id,status,item_snapshot").eq("operation_checklist_id", frozen.id).order("created_at");
  const company = Array.isArray(operation.company) ? operation.company[0] : operation.company; const fidc = Array.isArray(frozen.fidc) ? frozen.fidc[0] : frozen.fidc;
  return <div className="live-page"><div className="live-page-heading"><div><p className="eyebrow">{operation.public_code} · {fidc?.name}</p><h1>Documentos de {company?.legal_name}</h1><p>Um mesmo arquivo pode ser vinculado a vários requisitos equivalentes deste checklist.</p></div><a className="secondary-button" href={`/portal/operacoes/${id}`}>Voltar à operação</a></div><DocumentUploader operationId={id} initialRequirements={requirements ?? []} canUpload={context.subscriptionStatus === "active"} /></div>;
}
