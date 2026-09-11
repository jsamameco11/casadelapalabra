import { NextResponse, type NextRequest } from "next/server";

// Proxies the Google ID-token exchange to the shared Folio "google-session"
// Edge Function from OUR server instead of the browser. The function is
// already used successfully this way by contrataciones/ingenieria
// (server-to-server call, no browser Origin header) — calling it directly
// from the browser is what was failing here.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    id_token?: string;
    email?: string;
    name?: string;
    sub?: string;
    install_id?: string;
  };

  if (!body.id_token) {
    return NextResponse.json({ message: "Falta el identificador de Google." }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(`${supabaseUrl}/functions/v1/google-session`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id_token: body.id_token,
      email: body.email,
      name: body.name,
      sub: body.sub,
      install_id: body.install_id,
      app: "casa-de-la-palabra",
    }),
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
