import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Creates a pending payment row and returns its id + the operator +
// phone the user chose. When the real MTN/Orange provider is wired,
// this route will also initiate the provider's STK push here and
// return the transaction reference; for now it just records intent.

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

  const provider = String(body?.provider ?? "");
  const phone = String(body?.phone ?? "").replace(/\s+/g, "");
  if (!OPERATORS.has(provider)) {
    return NextResponse.json({ error: "invalid_provider" }, { status: 400 });
  }
  if (!/^[0-9]{8,15}$/.test(phone)) {
    return NextResponse.json({ error: "invalid_phone" }, { status: 400 });
  }

  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      provider,
      status: "pending",
      amount: Number(process.env.PAYMENT_AMOUNT || 1999),
      currency: process.env.PAYMENT_CURRENCY || "XAF",
      raw: { phone, source: "user_init" },
    })
    .select()
    .single();
  if (error || !payment) {
    console.error("[payments.init]", error?.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({
    payment_id: payment.id,
    status: payment.status,
    // Provider not wired yet; frontend shows a "waiting for confirmation"
    // screen until a real provider webhook flips the status.
    provider_ready: false,
  });
}
