"use client";

import { useState } from "react";

type ReportType = "dossier" | "proposal" | "pipeline" | "commissions" | "operation_zip";

export function ReportActions({ operationId, accountId, compact = false }: { operationId?: string; accountId?: string; compact?: boolean }) {
  const [loading, setLoading] = useState(""); const [message, setMessage] = useState("");
  async function generate(type: ReportType) { setLoading(type); setMessage(""); const response = await fetch(accountId ? "/api/admin/reports" : "/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, operationId, accountId }) }); const payload = await response.json(); setLoading(""); if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível gerar."); const link = document.createElement("a"); link.href = payload.data.downloadUrl; link.download = payload.data.fileName; link.rel = "noopener"; link.click(); }
  const actions: Array<[ReportType, string]> = operationId ? [["dossier", "Dossiê PDF"], ["proposal", "Proposta PDF"], ["operation_zip", "Pacote ZIP"]] : [["pipeline", "Pipeline Excel"], ["commissions", "Comissões Excel"]];
  return <div className={compact ? "report-actions compact" : "report-actions"}>{actions.map(([type, label]) => <button key={type} onClick={() => generate(type)} disabled={Boolean(loading)}>{loading === type ? "Gerando…" : label}</button>)}{message && <small>{message}</small>}</div>;
}
