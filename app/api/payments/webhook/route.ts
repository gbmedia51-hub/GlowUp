import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { PROGRAM_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";

// Provider-agnostic webhook. When a real MTN/Orange payment aggregator
// is chosen, add the provider's HMAC signature check at the top and
// map its field names to { payment_ref, status } below. The rest —
// marking success, activating the subscription, generating the plan —
// stays the same.
//
// Contract expected from the future provider integration:
//   POST /api/payments/webhook
//   body: { payment_ref: string (our payments.id), status: 'success' | 'failed' | 'pending', provider_ref?: string }
//   headers: X-Signature: <hmac> (verified with PAYMENT_WEBHOOK_SECRET)

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let payload: any = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    }
  } catch (e: any) {
    console.error("[payments.webhook] parse", e?.message);
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.log("[payments.webhook] payload", JSON.stringify(payload).slice(0, 800));

  // TODO: when provider is chosen, verify HMAC signature here using
  // process.env.PAYMENT_WEBHOOK_SECRET. Until then, this route only
  // logs, so it cannot cause any state change in production.
  const providerReady = Boolean(process.env.PAYMENT_WEBHOOK_SECRET);
  if (!providerReady) {
    return NextResponse.json({
      ok: true,
      note: "logged; provider not wired yet",
    });
  }

  const paymentRef = String(payload.payment_ref ?? "");
  const status = String(payload.status ?? "").toLowerCase();
  const providerRef = payload.provider_ref ? String(payload.provider_ref) : null;
  if (!paymentRef) {
    return NextResponse.json({ error: "missing_payment_ref" }, { status: 400 });
  }

  const admin = supabaseAdmin();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentRef)
    .maybeSingle();
  if (!payment) return NextResponse.json({ error: "payment_not_found" }, { status: 404 });

  // Idempotent
  if (payment.status === "success") {
    return NextResponse.json({ ok: true, already: true });
  }

  const newStatus =
    status === "success" ? "success" : status === "failed" ? "failed" : "pending";
  await admin
    .from("payments")
    .update({
      status: newStatus,
      provider_ref: providerRef,
      raw: { ...(payment.raw ?? {}), webhook: payload },
    })
    .eq("id", payment.id);

  if (newStatus !== "success") return NextResponse.json({ ok: true });

  // Activate the subscription and generate the personalized program.
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);
  await admin.from("subscriptions").upsert(
    {
      user_id: payment.user_id,
      status: "active",
      purchased_at: now.toISOString(),
      expires_at: expires.toISOString(),
      last_provider_ref: providerRef,
    },
    { onConflict: "user_id" },
  );

  try {
    const [{ data: profile }, { data: assessment }] = await Promise.all([
      admin
        .from("profiles")
        .select("onboarding")
        .eq("user_id", payment.user_id)
        .maybeSingle(),
      admin
        .from("assessments")
        .select("*")
        .eq("user_id", payment.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (assessment) {
      const gen: any = await chatJson({
        model: process.env.OPENAI_MODEL_ASSESSMENT || "gpt-4o-mini",
        messages: [
          { role: "system", content: PROGRAM_SYSTEM },
          {
            role: "user",
            content: JSON.stringify({
              onboarding: profile?.onboarding ?? {},
              assessment,
            }),
          },
        ],
        maxTokens: 4096,
        temperature: 0.6,
      });
      if (Array.isArray(gen?.days) && gen.days.length >= 20) {
        const iso = (d: Date) => d.toISOString().slice(0, 10);
        await admin
          .from("programs")
          .update({ active: false })
          .eq("user_id", payment.user_id);
        await admin.from("programs").insert({
          user_id: payment.user_id,
          days: gen.days.slice(0, 30),
          start_date: iso(now),
          end_date: iso(expires),
          active: true,
        });
      }
    }
  } catch (e: any) {
    console.error("[payments.webhook] program gen", e?.message);
    // Sub still active; program can be regenerated on next dashboard open.
  }

  return NextResponse.json({ ok: true });
}
