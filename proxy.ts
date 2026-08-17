import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const demoOnly = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_DEMO_ONLY === "true";
  if (demoOnly && !request.nextUrl.pathname.startsWith("/demo")) {
    if (request.nextUrl.pathname.startsWith("/api")) return NextResponse.json({ error: { code: "demo_only", message: "Integrações reais estão desativadas neste preview." } }, { status: 404 });
    const url = request.nextUrl.clone(); url.pathname = "/demo"; url.search = ""; return NextResponse.redirect(url);
  }
  return updateSupabaseSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|og.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
