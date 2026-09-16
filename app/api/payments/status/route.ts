import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Frontend polls this to know whether the payment has been verified
// and the subscription is active.

export const runtime = "nodejs";

export async function GET(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "no_session" }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const { data: payment } = await supabase
    .from("payments")
    .select("status")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();

  const subActive =
    !!sub &&
    sub.status === "active" &&
    new Date(sub.expires_at).getTime() > Date.now();

  return NextResponse.json({
    payment_status: payment?.status ?? "unknown",
    subscription_active: subActive,
  });
}
