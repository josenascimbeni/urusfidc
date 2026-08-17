"use client";

import { useRef, useState } from "react";

type Requirement = { id: string; status: string; item_snapshot: { name?: string; detail?: string; required?: boolean; allowedMimeTypes?: string[]; maxSizeMb?: number } };

export function DocumentUploader({ operationId, initialRequirements, canUpload }: { operationId: string; initialRequirements: Requirement[]; canUpload: boolean }) {
  const [requirements, setRequirements] = useState(initialRequirements); const [selected, setSelected] = useState<string[]>([]); const [file, setFile] = useState<File | null>(null); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false); const inputRef = useRef<HTMLInputElement>(null);
  function toggle(id: string) { setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }
  async function upload() {
    if (!file || !selected.length) return; setLoading(true); setMessage("");
    const prepare = await fetch("/api/documents/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operationId, fileName: file.name, mimeType: file.type, sizeBytes: file.size, requirementIds: selected }) });
    const prepared = await prepare.json();
    if (!prepare.ok) { setLoading(false); return setMessage(prepared.error?.message ?? "Não foi possível preparar o envio."); }
    const sent = await fetch(prepared.data.signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!sent.ok) { setLoading(false); return setMessage("O arquivo não chegou ao armazenamento seguro."); }
    const complete = await fetch("/api/documents/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ documentId: prepared.data.documentId }) });
    const completed = await complete.json(); setLoading(false);
    if (!complete.ok) return setMessage(completed.error?.message ?? "Não foi possível validar o arquivo.");
    setRequirements((items) => items.map((item) => selected.includes(item.id) ? { ...item, status: "analyzing" } : item)); setSelected([]); setFile(null); if (inputRef.current) inputRef.current.value = ""; setMessage("Arquivo recebido. A análise prévia foi colocada na fila.");
  }
  return <div className="document-workspace"><div className="demo-upload-warning"><strong>Ambiente real</strong><p>Envie somente documentos autorizados pelo titular. Os arquivos ficam privados, mas o antivírus ainda não está habilitado nesta versão.</p></div><section className="requirement-list"><header><div><p className="eyebrow">CHECKLIST CONGELADO</p><h2>Selecione o que o arquivo atende</h2></div><span>{requirements.filter((item) => item.status === "approved").length}/{requirements.filter((item) => item.item_snapshot.required).length} obrigatórios aprovados</span></header>{requirements.map((requirement) => <label key={requirement.id} className={`requirement-row ${requirement.status}`}><input type="checkbox" checked={selected.includes(requirement.id)} onChange={() => toggle(requirement.id)} disabled={!canUpload || requirement.status === "approved"}/><span><strong>{requirement.item_snapshot.name ?? "Documento"}</strong><small>{requirement.item_snapshot.detail}</small></span><b>{requirement.item_snapshot.required ? "Obrigatório" : "Não obrigatório"}</b><em>{requirement.status === "review_required" ? "Revisão necessária" : requirement.status}</em></label>)}</section><section className="document-drop"><label>Arquivo<input ref={inputRef} type="file" accept=".pdf,.xls,.xlsx,.csv,.jpg,.jpeg,.png" onChange={(event) => setFile(event.target.files?.[0] ?? null)} disabled={!canUpload}/></label><p>{file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, Excel, CSV, JPG ou PNG · até 25 MB"}</p><button className="live-gold-button" onClick={upload} disabled={!canUpload || loading || !file || !selected.length}>{loading ? "Validando arquivo…" : `Enviar para ${selected.length || 0} requisito(s)`}</button>{!canUpload && <small>Assinatura inativa: os documentos existentes continuam disponíveis somente para consulta.</small>}{message && <small className="live-form-message">{message}</small>}</section></div>;
}
