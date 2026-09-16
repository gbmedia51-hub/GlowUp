import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { checkPayment } from "@/lib/monetbil";
import { PROGRAM_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";

async function ensureProgram(
  supabase: any,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding")
    .eq("user_id", userId)
    .maybeSingle();
  const { data: assessment } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!assessment) return { ok: false, error: "no_assessment" };

  const result = await chatJson<{ days: any[] }>({
    model: process.env.OPENAI_MODEL_ASSESSMENT || "gpt-4o",
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
  if (!Array.isArray(result?.days) || result.days.length < 20) {
    return { ok: false, error: "invalid_program" };
  }

  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  await supabase.from("programs").update({ active: false }).eq("user_id", userId);
  const { error } = await supabase.from("programs").insert({
    user_id: userId,
    days: result.days.slice(0, 30),
    start_date: iso(start),
    end_date: iso(end),
    active: true,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export default async function ReturnPage({
  searchParams,
}: {
  searchParams: {
    payment_ref?: string;
    transaction_UUID?: string;
    transaction_id?: string;
    status?: string;
  };
}) {
  const { supabase, user } = await requireUser();
  const paymentRef = searchParams.payment_ref;
  const transactionId =
    searchParams.transaction_UUID || searchParams.transaction_id || "";

  if (!paymentRef) {
    return (
      <ErrorScreen
        title="Référence manquante"
        detail="Impossible de retrouver votre paiement. Réessayez depuis la page d'abonnement."
      />
    );
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("id", paymentRef)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!payment) {
    return (
      <ErrorScreen
        title="Paiement introuvable"
        detail="Cette référence ne correspond à aucun paiement de votre compte."
      />
    );
  }

  // If we've already processed this payment, jump straight to today.
  if (payment.status === "success") {
    redirect("/pro/today");
  }

  // Verify with Monetbil.
  let status: "success" | "failed" | "pending" | "unknown" = "unknown";
  let raw: any = payment.raw ?? {};
  if (transactionId) {
    const result = await checkPayment(transactionId);
    status = result.status;
    raw = { ...raw, checkPayment: result.raw, transactionId };
  } else {
    // No transaction id from the return URL — leave as unknown; ask user
    // to retry or wait for the webhook.
    status = "pending";
  }

  await supabase
    .from("payments")
    .update({
      status: status === "success" ? "success" : status === "failed" ? "failed" : "pending",
      provider_ref: transactionId || null,
      raw,
    })
    .eq("id", payment.id);

  if (status !== "success") {
    return (
      <ErrorScreen
        title={status === "failed" ? "Paiement refusé" : "Paiement en attente"}
        detail={
          status === "failed"
            ? "Votre paiement n'a pas été validé. Vous pouvez réessayer."
            : "Nous n'avons pas encore la confirmation. Réessayez dans quelques instants."
        }
      />
    );
  }

  // Payment confirmed. Activate subscription + generate program.
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 30);
  await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      status: "active",
      purchased_at: now.toISOString(),
      expires_at: expires.toISOString(),
      last_provider_ref: transactionId,
    },
    { onConflict: "user_id" },
  );

  const gen = await ensureProgram(supabase, user.id);
  if (!gen.ok) {
    return (
      <ErrorScreen
        title="Abonnement activé"
        detail={
          "Votre paiement a bien été reçu, mais la génération du programme a échoué. Ouvrez la page d'accueil et relancez — l'IA réessaiera."
        }
        cta={{ href: "/pro/today", label: "Aller à mon tableau" }}
      />
    );
  }

  redirect("/pro/today");
}

function ErrorScreen({
  title,
  detail,
  cta,
}: {
  title: string;
  detail: string;
  cta?: { href: string; label: string };
}) {
  return (
    <main className="min-h-screen bg-bg px-6 pt-16 pb-10 text-center">
      <div className="w-16 h-16 rounded-full mx-auto bg-rose/40 border border-accent/20 flex items-center justify-center text-3xl">
        ✦
      </div>
      <h1 className="mt-6 font-display text-[26px] text-ink">{title}</h1>
      <p className="mt-3 text-ink-muted max-w-xs mx-auto">{detail}</p>
      <div className="mt-6 space-y-2 max-w-xs mx-auto">
        <Link href={cta?.href ?? "/paywall"} className="btn-primary">
          {cta?.label ?? "Retour à l'abonnement"}
        </Link>
        <Link href="/pro/today" className="btn-ghost">
          Aller à mon tableau
        </Link>
      </div>
    </main>
  );
}
