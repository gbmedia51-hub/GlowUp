import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { createCheckoutSession } from "@/lib/saspay";

export const runtime = "nodejs";

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://glowup.africa"
  );
}

export async function POST() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const amount = Number(process.env.PAYMENT_AMOUNT || 1999);
  const currency = process.env.PAYMENT_CURRENCY || "XAF";

  // Insert pending payment row first — its uuid becomes our
  // metadata.payment_id for the webhook to match on.
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      provider: "saspay",
      status: "pending",
      amount,
      currency,
      raw: { source: "init" },
    })
    .select()
    .single();
  if (error || !payment) {
    console.error("[payments.init] db", error?.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  try {
    const session = await createCheckoutSession({
      amount,
      currency,
      paymentId: payment.id,
      userId: user.id,
      description: `GlowUp Pro — routine 30 jours (${payment.id.slice(0, 8)})`,
      returnUrl: `${appUrl()}/paywall/return?payment_id=${payment.id}`,
    });

    await supabase
      .from("payments")
      .update({
        provider_ref: session.id,
        raw: { ...(payment.raw ?? {}), saspay: { init: session.raw } },
      })
      .eq("id", payment.id);

    return NextResponse.json({
      payment_id: payment.id,
      redirect_url: session.checkout_url,
    });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    console.error("[payments.init] saspay", msg);
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
