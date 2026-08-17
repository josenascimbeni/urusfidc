import { NextResponse } from "next/server";
import { z } from "zod";
import { apiErrorResponse, ApiError } from "@/lib/api/errors";
import { requireAccountContext } from "@/lib/auth/context";
import { confirmedSubscriptionPurchase } from "@/lib/domain/billing";
import { stripe } from "@/lib/services/stripe";

export const dynamic = "force-dynamic";

const sessionIdSchema = z.string().trim().startsWith("cs_").max(255);

export async function GET(request: Request) {
  try {
    const context = await requireAccountContext();
    if (context.role !== "professional") throw new ApiError(403, "Esta confirmação pertence a uma conta de cliente.");
    const sessionId = sessionIdSchema.parse(new URL(request.url).searchParams.get("session_id"));
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    const purchase = confirmedSubscriptionPurchase(session, context.accountId);
    if (!purchase) throw new ApiError(409, "O pagamento ainda não foi confirmado.", "payment_not_confirmed");
    return NextResponse.json({ data: purchase }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
