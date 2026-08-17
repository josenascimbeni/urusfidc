"use client";

import { useMemo, useState } from "react";

type ChecklistItem = { stable_key: string; name: string; detail: string; required: boolean; multiplicity: string; max_size_mb: number };
type ChecklistTemplate = { id: string; name: string; scope: string; active_version: number; items: ChecklistItem[]; fidc?: { name?: string } | Array<{ name?: string }> | null };

const mimeTypes = ["application/pdf", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "image/jpeg", "image/png"];

export function ChecklistManager({ initialTemplates }: { initialTemplates: ChecklistTemplate[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [selectedId, setSelectedId] = useState(initialTemplates[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const selected = useMemo(() => templates.find((item) => item.id === selectedId), [templates, selectedId]);

  async function refresh() {
    const response = await fetch("/api/admin/checklists", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) setTemplates(payload.data);
  }

  async function addItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/checklists", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      templateId: selectedId, name: form.get("name"), detail: form.get("detail"), instructions: form.get("instructions"),
      required: form.get("required") === "true", multiplicity: form.get("multiplicity"), validityDays: null,
      allowedMimeTypes: mimeTypes, maxSizeMb: 25, expectedEvidence: String(form.get("evidence") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
      aiStandard: form.get("aiStandard"),
    }) });
    const payload = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível incluir o documento.");
    await refresh(); setOpen(false);
  }

  async function archive(stableKey: string) {
    if (!selected || !window.confirm("Arquivar este item nas próximas operações? Versões antigas serão preservadas.")) return;
    setLoading(true); setMessage("");
    const response = await fetch("/api/admin/checklists", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ templateId: selected.id, stableKey }) });
    const payload = await response.json(); setLoading(false);
    if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível arquivar.");
    await refresh();
  }

  return <><div className="live-page-heading"><div><p className="eyebrow">DOCUMENTAÇÃO VERSIONADA</p><h1>Checklists</h1><p>O padrão Urus é sempre somado ao adicional de cada FIDC. Alterações valem apenas para novos congelamentos.</p></div><button className="live-primary-link" disabled={!selected} onClick={() => setOpen(true)}>＋ Incluir documento</button></div><section className="checklist-workbench"><aside><label>Checklist ativo<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{templates.map((template) => <option value={template.id} key={template.id}>{template.scope === "urus_standard" ? "Padrão Urus" : template.name}</option>)}</select></label>{selected && <div><span>{selected.scope === "urus_standard" ? "BASE OBRIGATÓRIA" : "ADICIONAL DO FIDC"}</span><strong>Versão {selected.active_version}</strong><small>{selected.items.length} itens ativos</small></div>}</aside><div className="checklist-items">{selected?.items.map((item, index) => <article key={item.stable_key}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{item.name}</strong><p>{item.detail}</p><small>{item.multiplicity === "per_year" ? "Por exercício" : item.multiplicity === "per_partner" ? "Por sócio" : "Arquivo único"} · até {item.max_size_mb} MB</small></div><b className={item.required ? "required" : "optional"}>{item.required ? "Obrigatório" : "Não obrigatório"}</b><button onClick={() => archive(item.stable_key)} disabled={loading}>Arquivar</button></article>)}{!selected?.items.length && <div className="live-empty"><strong>Nenhum documento adicional</strong><p>Inclua apenas as exigências específicas deste FIDC.</p></div>}</div></section>{message && <p className="live-form-message">{message}</p>}{open && selected && <div className="live-modal-backdrop" role="dialog" aria-modal="true"><form className="live-fidc-modal checklist-modal" onSubmit={addItem}><header><div><p className="eyebrow">{selected.name}</p><h2>Novo documento</h2></div><button type="button" onClick={() => setOpen(false)}>×</button></header><div className="live-form-grid"><label>Nome do documento<input name="name" required /></label><label>Ocorrência<select name="multiplicity"><option value="single">Arquivo único</option><option value="per_year">Por exercício</option><option value="per_partner">Por sócio</option></select></label><fieldset className="wide requirement-choice"><legend>Classificação</legend><label><input type="radio" name="required" value="true" defaultChecked/> Obrigatório</label><label><input type="radio" name="required" value="false"/> Não obrigatório</label></fieldset><label className="wide">Descrição<textarea name="detail" required /></label><label className="wide">Orientações para o profissional<textarea name="instructions" required /></label><label className="wide">Evidências esperadas <small>Uma por linha</small><textarea name="evidence" /></label><label className="wide">Padrão de validação da IA<textarea name="aiStandard" required placeholder="Descreva como a IA deve identificar e avaliar este documento." /></label></div>{message && <p className="live-form-message">{message}</p>}<footer><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="live-gold-button" disabled={loading}>{loading ? "Versionando…" : "Incluir no checklist"}</button></footer></form></div>}</>;
}
