"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MatchingButton({ operationId, alreadySubmitted }: { operationId: string; alreadySubmitted: boolean }) {
  const router = useRouter(); const [loading, setLoading] = useState(false); const [message, setMessage] = useState("");
  return <div className="live-match-action"><button className="live-gold-button" disabled={loading} onClick={async () => { setLoading(true); const response = await fetch(`/api/operations/${operationId}/submit`, { method: "POST" }); const payload = await response.json(); setLoading(false); if (!response.ok) return setMessage(payload.error?.message ?? "Não foi possível processar o matching."); setMessage("Matching processado com regras explicáveis."); router.refresh(); }}>{loading ? "Processando…" : alreadySubmitted ? "Reprocessar matching" : "Enviar ao matching"}</button>{message && <p role="status">{message}</p>}</div>;
}
