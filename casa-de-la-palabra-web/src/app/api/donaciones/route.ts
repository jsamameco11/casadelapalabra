import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Server-side Culqi charge creation. The secret key never reaches the
// browser — the client only ever sees the Culqi Checkout widget (public
// key) and hands us back a one-time card token, which we exchange for a
// real charge here using CULQI_SECRET_KEY.
const MIN_AMOUNT_CENTS = 300; // $3.00 USD minimum, per the donation page copy.
const MAX_AMOUNT_CENTS = 100000000; // sanity ceiling, matches the DB check constraint.

export async function POST(request: NextRequest) {
  const secretKey = process.env.CULQI_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      {
        message:
          "Las donaciones con tarjeta aún no están configuradas: falta CULQI_SECRET_KEY en el servidor.",
      },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    amount_cents?: number;
    donor_name?: string;
    donor_email?: string;
  };

  const { token, amount_cents, donor_name, donor_email } = body;

  if (!token) {
    return NextResponse.json({ message: "Falta el token de la tarjeta." }, { status: 400 });
  }
  if (!Number.isInteger(amount_cents) || amount_cents! < MIN_AMOUNT_CENTS || amount_cents! > MAX_AMOUNT_CENTS) {
    return NextResponse.json({ message: "El monto de la donación no es válido." }, { status: 400 });
  }
  if (!donor_email) {
    return NextResponse.json({ message: "Falta el correo del donante." }, { status: 400 });
  }

  const supabase = await createClient();

  const culqiRes = await fetch("https://api.culqi.com/v2/charges", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount_cents,
      currency_code: "USD",
      email: donor_email,
      source_id: token,
      description: "Donación — Casa de la Palabra",
      metadata: donor_name ? { donor_name } : undefined,
    }),
  });

  const culqiData = await culqiRes.json().catch(() => ({}));

  if (!culqiRes.ok) {
    const failureMessage: string =
      culqiData?.user_message || culqiData?.merchant_message || "El banco rechazó la tarjeta.";

    await supabase.from("casa_donations").insert({
      method: "card",
      amount_cents,
      currency: "USD",
      donor_name: donor_name || null,
      donor_email,
      status: "failed",
      failure_message: failureMessage,
    });

    return NextResponse.json({ message: failureMessage }, { status: 402 });
  }

  await supabase.from("casa_donations").insert({
    method: "card",
    amount_cents,
    currency: "USD",
    donor_name: donor_name || null,
    donor_email,
    culqi_charge_id: culqiData.id,
    status: "succeeded",
  });

  return NextResponse.json({ ok: true, charge_id: culqiData.id });
}
