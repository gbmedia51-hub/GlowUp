import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/saspay";
import { PROGRAM_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";

// SasPay webhook. Envelope: { event: "transaction.success", data: {...} }
// We verify HMAC-SHA256(secret, `${saspay-timestamp}.${rawBody}`) against
// the Saspay-Signature header. On a verified transaction.success whose
// data.metadata.payment_id matches one of our pending payments, we mark
// it success, extend the subscription 30 days, and generate the program
// if none exists or the existing one is finished.

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifyWebhookSignature(rawBody, req.headers)) {
    console.warn("[saspay.webhook] signature check failed");
    return NextResponse.json(
      { ok: false, error: "bad_signature" },
      { status: 401 },
    );
  }

  let payload: any = {};
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (e: any) {
    console.error("[saspay.webhook] parse", e?.message);
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const event = String(payload?.event ?? "");
  const data = payload?.data ?? {};
  console.log("[saspay.webhook]", event, JSON.stringify(data).slice(0, 500));

  // Only care about transaction lifecycle events for checkout payments.
  if (!event.startsWith("transaction.")) {
    return NextResponse.json({ ok: true, note: "ignored non-transaction event" });
  }

  const paymentId: string = String(data?.metadata?.payment_id ?? "");
  if (!paymentId) {
    return NextResponse.json({
      ok: true,
      note: "no payment_id in metadata; ignored",
    });
  }

  const admin = supabaseAdmin();
  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .maybeSingle();
  if (!payment) {
    return NextResponse.json({ ok: true, note: "payment not found" });
  }

  // Idempotent — SasPay retries.
  if (payment.status === "success") {
    return NextResponse.json({ ok: true, already: true });
  }

  const nextStatus =
    event === "transaction.success"
      ? "success"
      : event === "transaction.failed" || event === "transaction.canceled"
        ? "failed"
        : "pending";

  await admin
    .from("payments")
    .update({
      status: nextStatus,
      provider_ref: String(data?.id ?? data?.reference ?? payment.provider_ref ?? ""),
      raw: {
        ...(payment.raw ?? {}),
        webhook_payload: payload,
      },
    })
    .eq("id", payment.id);

  if (nextStatus !== "success") return NextResponse.json({ ok: true });

  // Activate or extend the subscription: renewal adds 30 days to the
  // current expires_at so users never lose paid time.
  const now = new Date();
  const { data: existingSub } = await admin
    .from("subscriptions")
    .select("expires_at, status")
    .eq("user_id", payment.user_id)
    .maybeSingle();

  const base =
    existingSub &&
    existingSub.status === "active" &&
    new Date(existingSub.expires_at).getTime() > Date.now()
      ? new Date(existingSub.expires_at)
      : now;
  const expires = new Date(base);
  expires.setDate(expires.getDate() + 30);

  await admin.from("subscriptions").upsert(
    {
      user_id: payment.user_id,
      status: "active",
      purchased_at: now.toISOString(),
      expires_at: expires.toISOString(),
      last_provider_ref: String(data?.id ?? data?.reference ?? ""),
    },
    { onConflict: "user_id" },
  );

  // Only (re)generate a program when there is none or the current is done.
  const { data: activeProgram } = await admin
    .from("programs")
    .select("id, start_date, days")
    .eq("user_id", payment.user_id)
    .eq("active", true)
    .maybeSingle();

  const shouldGenerate = (() => {
    if (!activeProgram) return true;
    const start = new Date(activeProgram.start_date + "T00:00:00Z").getTime();
    const dayIndex = Math.floor((Date.now() - start) / 86_400_000) + 1;
    const total = Array.isArray(activeProgram.days)
      ? activeProgram.days.length
      : 30;
    return dayIndex > total;
  })();

  if (!shouldGenerate) {
    return NextResponse.json({ ok: true, extended: true, kept_program: true });
  }

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
        const start = new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + 30);
        await admin
          .from("programs")
          .update({ active: false })
          .eq("user_id", payment.user_id);
        await admin.from("programs").insert({
          user_id: payment.user_id,
          days: gen.days.slice(0, 30),
          start_date: iso(start),
          end_date: iso(end),
          active: true,
        });
      }
    }
  } catch (e: any) {
    console.error("[saspay.webhook] program gen", e?.message);
  }

  return NextResponse.json({ ok: true });
}
