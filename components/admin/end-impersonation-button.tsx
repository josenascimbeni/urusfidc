"use client";

import { useState } from "react";

export function EndImpersonationButton({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState(false);
  return <button disabled={loading} onClick={async () => { setLoading(true); await fetch("/api/admin/impersonation/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId }) }); window.location.assign("/admin"); }}>{loading ? "Encerrando…" : "Encerrar visualização"}</button>;
}
