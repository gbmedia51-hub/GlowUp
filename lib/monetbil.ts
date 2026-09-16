// Monetbil widget v2.1 integration.
// https://www.monetbil.com/docs/widget/v2.1/ (widget) and
// https://www.monetbil.com/docs/api/checkPayment/ (server verification).

const WIDGET_BASE = "https://api.monetbil.com/widget/v2.1";
const CHECK_PAYMENT = "https://api.monetbil.com/payment/v1/checkPayment";

export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} missing`);
  return v;
}

export function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000"
  );
}

export function buildWidgetUrl(params: {
  paymentRef: string;
  itemRef: string;
  user?: string;
  email?: string;
}): string {
  const serviceKey = requireEnv("MONETBIL_SERVICE_KEY");
  const amount = process.env.MONETBIL_AMOUNT || "1999";
  const currency = process.env.MONETBIL_CURRENCY || "XAF";
  const base = appUrl();

  const query = new URLSearchParams({
    amount,
    currency,
    locale: "fr",
    country: "CM",
    item_ref: params.itemRef,
    payment_ref: params.paymentRef,
    return_url: `${base}/pro/return?payment_ref=${params.paymentRef}`,
    notify_url: `${base}/api/monetbil/webhook`,
  });
  if (params.user) query.set("user", params.user);
  if (params.email) query.set("email", params.email);
  return `${WIDGET_BASE}/${serviceKey}?${query.toString()}`;
}

export type CheckPaymentResult = {
  status: "success" | "failed" | "pending" | "unknown";
  raw: any;
  transactionId?: string;
  operator?: string;
  msisdn?: string;
  amount?: number;
  currency?: string;
};

export async function checkPayment(transactionId: string): Promise<CheckPaymentResult> {
  const body = new URLSearchParams({ paymentId: transactionId });
  try {
    const r = await fetch(CHECK_PAYMENT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const json: any = await r.json().catch(() => ({}));
    const status = normalizeStatus(json?.status ?? json?.transaction?.status);
    return {
      status,
      raw: json,
      transactionId: json?.transaction?.transaction_UUID ?? transactionId,
      operator: json?.transaction?.operator,
      msisdn: json?.transaction?.msisdn,
      amount: Number(json?.transaction?.amount) || undefined,
      currency: json?.transaction?.currency,
    };
  } catch (e: any) {
    return { status: "unknown", raw: { error: e?.message } };
  }
}

function normalizeStatus(s: unknown): CheckPaymentResult["status"] {
  const str = String(s ?? "").toLowerCase();
  if (["success", "successful", "1", "completed"].includes(str)) return "success";
  if (["failed", "failure", "cancelled", "canceled", "0"].includes(str)) return "failed";
  if (["pending", "initiated", "processing"].includes(str)) return "pending";
  return "unknown";
}
