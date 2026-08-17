import "server-only";

import { Resend } from "resend";
import { requireServerEnv } from "@/lib/config/env";

let resendClient: Resend | null = null;
export function resend() { resendClient ??= new Resend(requireServerEnv("RESEND_API_KEY")); return resendClient; }
