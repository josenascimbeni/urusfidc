import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processAiReview } from "@/lib/services/document-ai";
import { resend } from "@/lib/services/resend";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createDeliveryToken } from "@/lib/security/delivery-tokens";

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET ?? ""; const actual = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  return expected.length >= 16 && actual.length === expected.length && timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const admin = createAdminSupabaseClient(); const processed: string[] = [];
  const { data: review } = await admin.from("ai_reviews").select("id").eq("status", "queued").order("created_at").limit(1).maybeSingle();
  if (review) {
    await admin.from("ai_reviews").update({ status: "processing" }).eq("id", review.id).eq("status", "queued");
    try { await processAiReview(review.id); processed.push(`ai:${review.id}`); } catch (error) { await admin.from("ai_reviews").update({ status: "failed", error_code: error instanceof Error ? error.message.slice(0, 80) : "unknown" }).eq("id", review.id); }
  }
  const { data: notification } = await admin.from("notification_outbox").select("id,account_id,audience,recipient,template_key,safe_payload,attempts").eq("status", "queued").lte("next_attempt_at", new Date().toISOString()).order("created_at").limit(1).maybeSingle();
  if (notification) {
    try {
      let recipient = notification.recipient;
      if (!recipient && notification.audience === "professional" && notification.account_id) {
        const { data: account } = await admin.from("customer_accounts").select("owner_user_id").eq("id", notification.account_id).single();
        if (account) recipient = (await admin.auth.admin.getUserById(account.owner_user_id)).data.user?.email ?? null;
      }
      if (!recipient && notification.audience === "urus") recipient = process.env.ADMIN_NOTIFICATION_EMAIL ?? null;
      if (!recipient) throw new Error("notification_recipient_missing");
      let accessUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
      if (notification.template_key === "fidc_distribution") { const deliveryId = (notification.safe_payload as { deliveryId?: string }).deliveryId; const { data: delivery } = deliveryId ? await admin.from("secure_deliveries").select("id,expires_at").eq("id", deliveryId).single() : { data: null }; if (delivery) accessUrl = `${accessUrl}/entrega/${createDeliveryToken(delivery.id, delivery.expires_at)}`; }
      await resend().emails.send({ from: process.env.RESEND_FROM_EMAIL ?? "Urus FIDC <notificacoes@example.com>", to: recipient, subject: "Atualização na Urus FIDC", html: `<div style="font-family:Arial;color:#16213a"><h2>Urus FIDC</h2><p>Há uma atualização que requer sua atenção.</p><p><a href="${accessUrl}">Acessar com segurança</a></p><small>Por segurança, este e-mail não contém informações financeiras ou documentos.</small></div>` });
      await admin.from("notification_outbox").update({ status: "sent", attempts: notification.attempts + 1 }).eq("id", notification.id);
      if (notification.template_key === "fidc_distribution") await admin.from("secure_deliveries").update({ status: "sent" }).eq("id", (notification.safe_payload as { deliveryId?: string }).deliveryId);
      processed.push(`email:${notification.id}`);
    } catch { await admin.from("notification_outbox").update({ status: notification.attempts >= 4 ? "failed" : "queued", attempts: notification.attempts + 1, next_attempt_at: new Date(Date.now() + 15 * 60 * 1000).toISOString() }).eq("id", notification.id); }
  }
  const { data: expiredOperations } = await admin.from("operations").select("id,account_id").eq("legal_hold", false).not("retention_due_at", "is", null).lte("retention_due_at", new Date().toISOString()).limit(10);
  for (const operation of expiredOperations ?? []) {
    const { data: documents } = await admin.from("uploaded_documents").select("id,storage_path").eq("operation_id", operation.id).is("deleted_at", null);
    if (documents?.length) { await admin.storage.from("documents").remove(documents.map((document) => document.storage_path)); await admin.from("uploaded_documents").update({ deleted_at: new Date().toISOString() }).in("id", documents.map((document) => document.id)); }
    await admin.from("audit_logs").insert({ account_id: operation.account_id, action: "retention.documents_deleted", entity_type: "operation", entity_id: operation.id, safe_metadata: { documentCount: documents?.length ?? 0 } });
    processed.push(`retention:${operation.id}`);
  }
  const { data: expiredExports } = await admin.from("exports").select("id,storage_path").in("status", ["ready", "failed"]).lte("expires_at", new Date().toISOString()).limit(25);
  if (expiredExports?.length) {
    const paths = expiredExports.map((item) => item.storage_path).filter(Boolean) as string[];
    if (paths.length) await admin.storage.from("exports").remove(paths);
    await admin.from("exports").update({ status: "expired", storage_path: null }).in("id", expiredExports.map((item) => item.id));
    processed.push(`exports:${expiredExports.length}`);
  }
  await admin.from("rate_limit_buckets").delete().lt("updated_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  return NextResponse.json({ processed });
}
