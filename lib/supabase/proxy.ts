import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { publicSupabaseConfig } from "@/lib/config/env";

export async function updateSupabaseSession(request: NextRequest) {
  const config = publicSupabaseConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  const protectedRoute = request.nextUrl.pathname.startsWith("/portal") || request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname === "/seguranca";
  if (protectedRoute && !data.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("retorno", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return response;
}
