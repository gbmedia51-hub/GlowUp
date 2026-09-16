import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { buildWidgetUrl } from "@/lib/monetbil";

export const runtime = "nodejs";

export async function POST() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Create the payment row up front. The row's UUID becomes our payment_ref
  // sent to Monetbil, so the return page can look it up unambiguously.
  const { data: payment, error } = await supabase
    .from("payments")
    .insert({
      user_id: user.id,
      provider: "monetbil",
      amount: Number(process.env.MONETBIL_AMOUNT || 1999),
      currency: process.env.MONETBIL_CURRENCY || "XAF",
      status: "pending",
      raw: { source: "init" },
    })
    .select()
    .single();
  if (error || !payment) {
    console.error("[monetbil.init] db error", error?.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }

  try {
    const url = buildWidgetUrl({
      paymentRef: payment.id,
      itemRef: "glowup_pro_monthly",
      user: user.id,
      email: user.email ?? undefined,
    });
    return NextResponse.json({ payment_id: payment.id, redirect_url: url });
  } catch (e: any) {
    console.error("[monetbil.init]", e?.message);
    return NextResponse.json({ error: "monetbil_init_failed" }, { status: 500 });
  }
}
