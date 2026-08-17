"use client";

import { useState } from "react";

export function ImpersonationButton({ accountId, name }: { accountId: string; name: string }) {
  const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [message, setMessage] = useState(""); const [loading, setLoading] = useState(false);
  async function start() { setLoading(true); const response = await fetch("/api/admin/impersonation/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetAccountId: accountId, reason }) }); const payload = await response.json(); setLoading(false); if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível iniciar a visualização."); window.location.assign(payload.data.url); }
  return <div className="impersonation-control"><button onClick={() => setOpen((value) => !value)}>Visualizar como usuário</button>{open && <div className="impersonation-popover"><strong>Visualizar como {name}</strong><p>Modo somente leitura. Nenhuma ação, download ou consumo será permitido.</p><label>Motivo do acesso<textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Descreva a necessidade de suporte"/></label>{message && <small role="alert">{message}</small>}<div><button onClick={() => setOpen(false)}>Cancelar</button><button disabled={reason.trim().length < 10 || loading} onClick={start}>{loading ? "Iniciando…" : "Iniciar visualização"}</button></div></div>}</div>;
}
