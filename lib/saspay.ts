// SasPay hosted-checkout integration.
// Docs: https://docs.saspay.me/api-reference
//
// Flow:
//   1. Server calls POST /checkout-sessions/ with amount, customer,
//      return_url and a metadata.payment_id we can match on later.
//   2. SasPay returns a `checkout_url` — we redirect the user there.
//   3. User pays on SasPay's hosted page.
//   4. SasPay POSTs to our /api/payments/webhook with a signed body
//      whose `event` is `transaction.success` (or .failed / .canceled).
//   5. We verify HMAC-SHA256 of `${timestamp}.${rawBody}` against the
//      Saspay-Signature header using SASPAY_WEBHOOK_SECRET.

import crypto from "node:crypto";

function baseUrl(): string {
  const b = (process.env.SASPAY_BASE_URL || "https://api.saspay.me/api/v1")
    .replace(/\s+/g, "")
    .replace(/\/+$/, "");
  return b;
}

function authHeaders(): Record<string, string> {
  const key = (process.env.SASPAY_API_KEY || "").replace(/\s+/g, "");
  if (!key) throw new Error("SASPAY_API_KEY missing");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export type CheckoutSession = {
  id: string;
  slug?: string;
  checkout_url: string;
  amount: string;
  currency: string;
  raw: any;
};

export async function createCheckoutSession(input: {
  amount: number; // XAF whole units, we convert to "NNNN.00" string
  currency?: string;
  paymentId: string;
  userId: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  returnUrl: string;
}): Promise<CheckoutSession> {
  const currency = (input.currency || process.env.PAYMENT_CURRENCY || "XAF")
    .replace(/\s+/g, "");
  const body: Record<string, unknown> = {
    amount: input.amount.toFixed(2), // "1999.00"
    currency,
    customer_email:
      input.customerEmail || `${input.userId.slice(0, 8)}@glowup.africa`,
    customer_name: input.customerName || "Client GlowUp",
    description: input.description || "GlowUp Pro — routine 30 jours",
    return_url: input.returnUrl,
    metadata: { payment_id: input.paymentId, user_id: input.userId },
  };

  const r = await fetch(`${baseUrl()}/checkout-sessions/`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json: any = await r.json().catch(() => ({}));
  // SasPay wraps successful responses as { success: true, data: {...} }.
  // Fall back to top-level fields for safety.
  const payload = (json && typeof json === "object" && json.data) || json;
  if (!r.ok || !payload?.checkout_url) {
    throw new Error(
      `saspay ${r.status}: ${json?.message ?? json?.error ?? JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return {
    id: String(payload.id ?? ""),
    slug: payload.slug ?? undefined,
    checkout_url: String(payload.checkout_url),
    amount: String(payload.amount ?? body.amount),
    currency: String(payload.currency ?? currency),
    raw: json,
  };
}

// Verify the HMAC-SHA256(secret, `${timestamp}.${rawBody}`) signature
// SasPay sends on every webhook. Returns true only if the signature
// matches AND the timestamp is within the freshness window (5 min).
export function verifyWebhookSignature(
  rawBody: string,
  headers: Headers,
): boolean {
  const secret = (process.env.SASPAY_WEBHOOK_SECRET || "").replace(/\s+/g, "");
  if (!secret) {
    // No secret configured → fail closed in production.
    console.warn("[saspay.webhook] SASPAY_WEBHOOK_SECRET missing");
    return false;
  }
  const sig = (
    headers.get("saspay-signature") ||
    headers.get("x-saspay-signature") ||
    ""
  ).trim();
  const ts = (headers.get("saspay-timestamp") || "").trim();
  if (!sig || !ts) return false;

  // Freshness: reject anything older than 5 minutes to prevent replays.
  const nowSec = Math.floor(Date.now() / 1000);
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum)) return false;
  if (Math.abs(nowSec - tsNum) > 300) {
    console.warn("[saspay.webhook] stale timestamp", ts);
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${ts}.${rawBody}`)
    .digest("hex");

  // Accept both raw hex and prefixed forms (e.g. "sha256=abcd…").
  const normalized = sig.replace(/^sha256=/i, "").toLowerCase();
  const a = Buffer.from(normalized, "utf8");
  const b = Buffer.from(expected.toLowerCase(), "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
