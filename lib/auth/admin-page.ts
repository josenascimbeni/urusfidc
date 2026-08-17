import "server-only";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { requireAdmin } from "@/lib/auth/context";

export async function requireAdminPage() {
  try {
    return await requireAdmin({ mfa: true });
  } catch (error) {
    if (error instanceof ApiError && error.code === "mfa_required") redirect("/seguranca?retorno=/admin");
    throw error;
  }
}
