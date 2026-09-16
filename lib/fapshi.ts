// Fapshi direct-pay integration.
// Docs: https://docs.fapshi.com
//
// Fapshi doesn't sign webhooks — instead, it recommends re-verifying every
// notification by calling GET /payment-status/{transId} server-to-server
// with your API credentials. That's the pattern we use here.

const AUTH_HEADERS = () => {
  const user = (process.env.FAPSHI_API_USER || "").replace(/\s+/g, "");
  const key = (process.env.FAPSHI_API_KEY || "").replace(/\s+/g, "");
  if (!user || !key) throw new Error("FAPSHI_API_USER or FAPSHI_API_KEY missing");
  return {
    apiuser: user,
    apikey: key,
    "Content-Type": "application/json",
  };
};

function baseUrl(): string {
  const b = (process.env.FAPSHI_BASE_URL || "https://sandbox.fapshi.com")
    .replace(/\s+/g, "")
    .replace(/\/+$/, "");
  return b;
}

// Normalize a phone number to Fapshi's expected format (9-digit local Cameroon).
// Accepts +237XXXXXXXXX, 237XXXXXXXXX, or XXXXXXXXX.
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D+/g, "");
  if (digits.startsWith("237") && digits.length === 12) return digits.slice(3);
  if (digits.length === 9) return digits;
  // Otherwise return as-is and let Fapshi complain if invalid.
  return digits;
}

export type FapshiMedium = "mobile money" | "orange money";

// Map our internal operator ids to Fapshi's medium strings.
export function mediumFromOperator(operator: string): FapshiMedium | undefined {
  if (operator === "mtn_momo") return "mobile money";
  if (operator === "orange_money") return "orange money";
  return undefined;
}

export type DirectPayResult = {
  transId: string;
  message: string;
  dateInitiated?: string;
};

export async function directPay(input: {
  amount: number;
  phone: string;
  medium?: FapshiMedium;
  userId: string;
  externalId: string;
  name?: string;
  email?: string;
  message?: string;
}): Promise<DirectPayResult> {
  const body: Record<string, unknown> = {
    amount: input.amount,
    phone: input.phone,
    userId: input.userId,
    externalId: input.externalId,
  };
  if (input.medium) body.medium = input.medium;
  if (input.name) body.name = input.name;
  if (input.email) body.email = input.email;
  if (input.message) body.message = input.message;

  const r = await fetch(`${baseUrl()}/direct-pay`, {
    method: "POST",
    headers: AUTH_HEADERS(),
    body: JSON.stringify(body),
  });
  const json: any = await r.json().catch(() => ({}));
  if (!r.ok || !json?.transId) {
    throw new Error(
      `fapshi ${r.status}: ${json?.message ?? JSON.stringify(json).slice(0, 300)}`,
    );
  }
  return {
    transId: json.transId,
    message: json.message ?? "",
    dateInitiated: json.dateInitiated,
  };
}

export type PaymentStatus =
  | "CREATED"
  | "PENDING"
  | "SUCCESSFUL"
  | "FAILED"
  | "EXPIRED"
  | "UNKNOWN";

export type PaymentStatusResult = {
  status: PaymentStatus;
  transId: string;
  amount?: number;
  currency?: string;
  medium?: string;
  externalId?: string;
  userId?: string;
  payerName?: string;
  raw: any;
};

export async function checkPaymentStatus(
  transId: string,
): Promise<PaymentStatusResult> {
  const r = await fetch(`${baseUrl()}/payment-status/${encodeURIComponent(transId)}`, {
    method: "GET",
    headers: AUTH_HEADERS(),
  });
  const json: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    return { status: "UNKNOWN", transId, raw: json };
  }
  const raw = Array.isArray(json) ? json[0] : json;
  const rawStatus = String(raw?.status ?? "").toUpperCase();
  const status: PaymentStatus =
    rawStatus === "SUCCESSFUL" ||
    rawStatus === "FAILED" ||
    rawStatus === "PENDING" ||
    rawStatus === "CREATED" ||
    rawStatus === "EXPIRED"
      ? (rawStatus as PaymentStatus)
      : "UNKNOWN";
  return {
    status,
    transId: raw?.transId ?? transId,
    amount: Number(raw?.amount) || undefined,
    currency: raw?.currency,
    medium: raw?.medium,
    externalId: raw?.externalId,
    userId: raw?.userId,
    payerName: raw?.payerName,
    raw,
  };
}
