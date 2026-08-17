"use client";

import { useState } from "react";

export function ManualMatchRequest({ operationId, fidcId, currentDecision }: { operationId: string; fidcId: string; currentDecision?: string | null }) {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [decision, setDecision] = useState(currentDecision); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  if (decision) return <span className="manual-request-state">Exceção: {decision === "requested" ? "aguardando Urus" : decision === "approved" ? "aprovada" : decision === "rejected" ? "rejeitada" : decision}</span>;
  async function submit() { setLoading(true); setMessage(""); const response = await fetch(`/api/operations/${operationId}/selections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fidcId, reason }) }); const payload = await response.json(); setLoading(false); if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível solicitar."); setDecision("requested"); setOpen(false); }
  return <div className="manual-match-request">{!open ? <button onClick={() => setOpen(true)}>Solicitar avaliação manual</button> : <div><label>Justificativa da exceção<textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={10} maxLength={1000} placeholder="Explique por que este FIDC deve avaliar o caso." /></label>{message && <small>{message}</small>}<span><button onClick={() => setOpen(false)} disabled={loading}>Cancelar</button><button onClick={submit} disabled={loading || reason.trim().length < 10}>{loading ? "Enviando…" : "Enviar à Urus"}</button></span></div>}</div>;
}
