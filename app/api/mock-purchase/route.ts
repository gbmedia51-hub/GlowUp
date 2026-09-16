import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// TEMPORARY: mocks a successful Monetbil payment so the full flow works
// end-to-end during development. Replace with the real Monetbil webhook
// once payment credentials are wired.

export const runtime = "nodejs";

export async function POST() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);

  await supabase.from("payments").insert({
    user_id: user.id,
    provider: "mock",
    status: "mock",
    amount: 1999,
    currency: "XAF",
    raw: { note: "dev-only mock purchase" },
  });

  await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      status: "active",
      purchased_at: now.toISOString(),
      expires_at: expires.toISOString(),
      last_provider_ref: "mock",
    },
    { onConflict: "user_id" },
  );

  return NextResponse.json({ ok: true, expires_at: expires.toISOString() });
}
