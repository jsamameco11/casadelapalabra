import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Force HTTPS. Google Identity Services sends the page's origin to Google,
  // and "http://casadelapalabra..." is not (and must not be) a registered
  // JavaScript origin — serving the page over HTTP made every Google login
  // fail with origin_mismatch.
  //
  // The target host comes from NEXT_PUBLIC_SITE_URL, not from the request:
  // request.url carries the internal proxy address (localhost:8794), and
  // trusting the Host header instead would turn this into an open redirect.
  const host = request.headers.get("host") ?? "";
  const isInternalProbe = host.startsWith("127.0.0.1") || host.startsWith("localhost");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (request.headers.get("x-forwarded-proto") === "http" && siteUrl && !isInternalProbe) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, siteUrl), 308);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refresh the session if needed — keeps server components' cookies() reads
  // in sync with the actual auth state instead of a stale/expired token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jugar requiere sesión (Google) — todo /juegos queda detrás del login.
  if (request.nextUrl.pathname.startsWith("/juegos") && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    loginUrl.searchParams.set("reason", "juegos");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)"],
};
