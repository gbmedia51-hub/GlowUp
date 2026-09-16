import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { directPay, mediumFromOperator, normalizePhone } from "@/lib/fapshi";

// Initiates a Fapshi direct-pay charge. Fapshi will trigger an STK push
// on the user's MoMo / Orange Money phone; the user approves in their
// carrier prompt and Fapshi calls our /api/payments/webhook.

export const runtime = "nodejs";

const OPERATORS = new Set(["mtn_momo", "orange_money"]);

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const operator = String(body?.provider ?? "");
  const rawPhone = String(body?.phone ?? "");
  const phone = normalizePhone(rawPhone);
  if (!OPERATORS.has(operator)) {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }
  if (!/^[0-9]{9}$/.test(phone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const amount = Number(process.env.PAYMENT_AMOUNT || 1999);
  const currency = process.env.PAYMENT_CURRENCY || "XAF";

  // Create the pending payment row up front so its id becomes our
  // externalId reference to Fapshi — every notification can be matched
  // back to it unambiguously.
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      provider: "fapshi",
      status: "pending",
      amount,
      currency,
      raw: { operator, phone, source: "user_init" },
    })
    .select()
    .single();
  if (error || !payment) {
    console.error("[payments.init] db", error?.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  try {
    const result = await directPay({
      amount,
      phone,
      medium: mediumFromOperator(operator),
      userId: user.id,
      externalId: payment.id,
      message: "GlowUp Pro — abonnement 30 jours",
    });

    await supabase
      .from("payments")
      .update({
        provider_ref: result.transId,
        raw: { ...(payment.raw ?? {}), fapshi: { init: result } },
      })
      .eq("id", payment.id);

    return NextResponse.json({
      payment_id: payment.id,
      trans_id: result.transId,
      status: "pending",
    });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    console.error("[payments.init] fapshi", msg);
    await supabase
      .from("payments")
      .update({
        status: "failed",
        raw: { ...(payment.raw ?? {}), init_error: msg },
      })
      .eq("id", payment.id);
    return NextResponse.json(
      { error: "provider_error", detail: msg.slice(0, 300) },
      { status: 502 },
    );
  }
}
