import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkPaymentStatus } from "@/lib/fapshi";
import { PROGRAM_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";

// Fapshi webhook: POST with the transaction body. We do NOT trust the
// payload — instead we take the transId, re-query Fapshi's payment-status
// endpoint server-to-server (that call is authenticated with our API
// credentials), and act only on that verified status.

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

  // Activate the subscription and generate the 30-day program.
  const now = new Date();
  const expires = new Date(now);
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
  }

  return NextResponse.json({ ok: true });
}
