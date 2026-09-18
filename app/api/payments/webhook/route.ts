import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPaymentStatus } from "@/lib/fapshi";
import { PROGRAM_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";

// Fapshi webhook: POST with the transaction body.
//
// Security layers (defense in depth):
//   1. If FAPSHI_WEBHOOK_SECRET is set, verify the HMAC signature Fapshi
//      sends in the request headers — rejects spoofed webhooks up front.
//   2. Independent of signature, re-query /payment-status/{transId}
//      server-to-server with our API credentials. That is ground truth
//      and is not spoofable.

export const runtime = "nodejs";
export const maxDuration = 60;

function verifySignature(_rawBody: string, headers: Headers): boolean {
  const secret = (process.env.FAPSHI_WEBHOOK_SECRET || "").replace(/\s+/g, "");
  if (!secret) return true; // no secret configured → skip check
  // Fapshi sends the shared secret verbatim in a header. Dashboard tells us
  // it's `x-wh-secret`; accept a couple of common variants defensively.
  const sent =
    headers.get("x-wh-secret") ||
    headers.get("x-webhook-secret") ||
    headers.get("webhook-secret") ||
    "";
  const provided = sent.trim();
  if (!provided) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(secret, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers)) {
    console.warn("[payments.webhook] bad signature");
    return NextResponse.json({ ok: false, error: "bad_signature" }, { status: 401 });
  }

  let payload: any = {};
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } else {
      payload = Object.fromEntries(new URLSearchParams(rawBody).entries());
    }
  } catch (e: any) {
    console.error("[payments.webhook] parse", e?.message);
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  console.log("[payments.webhook] payload", JSON.stringify(payload).slice(0, 800));

  const transId: string = String(payload?.transId ?? "");
  if (!transId) {
    return NextResponse.json({ ok: true, note: "no transId, ignored" });
  }

  // Ground truth from Fapshi's own status endpoint.
  const verified = await checkPaymentStatus(transId);
  console.log(
    "[payments.webhook] verified",
    transId,
    verified.status,
    verified.externalId,
  );

  const admin = supabaseAdmin();
  const externalId = verified.externalId || String(payload?.externalId ?? "");
  if (!externalId) {
    return NextResponse.json({
      ok: true,
      note: "verified but no externalId to match",
    });
  }

  const { data: payment } = await admin
    .from("payments")
    .select("*")
    .eq("id", externalId)
    .maybeSingle();
  if (!payment) {
    return NextResponse.json({ ok: true, note: "payment not found" });
  }

  // Idempotent
  if (payment.status === "success") {
    return NextResponse.json({ ok: true, already: true });
  }

  const nextStatus =
    verified.status === "SUCCESSFUL"
      ? "success"
      : verified.status === "FAILED" || verified.status === "EXPIRED"
        ? "failed"
        : "pending";

  await admin
    .from("payments")
    .update({
      status: nextStatus,
      provider_ref: transId,
      raw: {
        ...(payment.raw ?? {}),
        webhook_payload: payload,
        verified: verified.raw,
      },
    })
    .eq("id", payment.id);

  if (nextStatus !== "success") return NextResponse.json({ ok: true });

  // Activate or extend the subscription. A renewal while still active
  // ADDS 30 days to the current expires_at — the user never loses time
  // they've already paid for. A first purchase or a lapsed sub sets
  // expires_at to now + 30 days.
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
      last_provider_ref: transId,
    },
    { onConflict: "user_id" },
  );

  // Decide whether to (re)generate the program.
  // Rule: if there's already an active program and the user hasn't
  // finished all 30 days, KEEP IT — renewal is a continuation. Only
  // generate a fresh program if there is no active program, or the
  // existing one is fully done.
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
    console.error("[payments.webhook] program gen", e?.message);
  }

  return NextResponse.json({ ok: true });
}
