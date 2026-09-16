import { NextResponse } from "next/server";

// Monetbil posts a notification here after a payment attempt. We can't do
// authenticated DB writes without a user session, so this endpoint only
// accepts + logs the payload for audit. The real state change happens on
// /pro/return which re-verifies the transaction via Monetbil's
// checkPayment API and updates the DB with the user's own JWT.
//
// Returning 200 tells Monetbil not to retry.

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  let payload: any = {};
  try {
    if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    }
  } catch (e: any) {
    console.error("[monetbil.webhook] parse", e?.message);
  }
  console.log("[monetbil.webhook]", JSON.stringify(payload).slice(0, 800));
  return NextResponse.json({ ok: true });
}
