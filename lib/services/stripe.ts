import "server-only";

import Stripe from "stripe";
import { requireServerEnv } from "@/lib/config/env";

let stripeClient: Stripe | null = null;

export function stripe() {
  stripeClient ??= new Stripe(requireServerEnv("STRIPE_SECRET_KEY"), { appInfo: { name: "Urus FIDC", version: "1.0.0" } });
  return stripeClient;
}

export function stripeIsLiveMode() {
  return requireServerEnv("STRIPE_SECRET_KEY").startsWith("sk_live_");
}
