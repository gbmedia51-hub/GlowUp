"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// User lands here after SasPay's hosted checkout. We poll our own
// /api/payments/status until either (a) subscription is active
// (webhook fired → redirect to /pro/today) or (b) enough time passed
// without confirmation (show "still processing" state).

export default function PaywallReturnPage() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentId = params.get("payment_id") ?? "";
  const [phase, setPhase] = useState<"checking" | "waiting" | "failed">(
    "checking",
  );
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!paymentId) {
      setPhase("failed");
      return;
    }
    let cancelled = false;
    const poll = async () => {
      try {
        const r = await fetch(
          `/api/payments/status?id=${encodeURIComponent(paymentId)}`,
        );
        const j = await r.json();
        if (cancelled) return;
        if (j?.subscription_active) {
          router.replace("/pro/today");
          return;
        }
        if (j?.payment_status === "failed") {
          setPhase("failed");
          return;
        }
        setPhase("waiting");
      } catch {
        /* ignore, retry */
      }
    };
    poll();
    const iv = setInterval(() => {
      setTries((t) => t + 1);
      poll();
    }, 4000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [paymentId, router]);

  if (phase === "failed") {
    return (
      <main className="min-h-screen bg-bg px-6 pt-16 pb-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose/40 border border-accent/20 flex items-center justify-center text-3xl">
          ⚠️
        </div>
        <h1 className="mt-6 font-display text-[26px] text-ink">
          Paiement non confirmé
        </h1>
        <p className="mt-3 text-ink-muted max-w-xs">
          Votre paiement n'a pas pu être vérifié. Si l'argent a été débité,
          il sera automatiquement remboursé sous 24h.
        </p>
        <div className="mt-6 space-y-2 max-w-xs w-full">
          <Link href="/paywall" className="btn-primary">
            Réessayer
          </Link>
          <Link href="/assessment" className="btn-ghost">
            Retour à mon analyse
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg px-6 pt-16 pb-10 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-full bg-rose/40 border border-accent/20 flex items-center justify-center text-3xl">
        ⏳
      </div>
      <h1 className="mt-6 font-display text-[26px] text-ink">
        Confirmation du paiement…
      </h1>
      <p className="mt-3 text-ink-muted max-w-xs">
        Nous attendons la confirmation de SasPay. Cette page se met à jour
        automatiquement.
      </p>
      {tries > 6 && (
        <p className="mt-3 text-xs text-ink-muted max-w-xs">
          Cela prend plus de temps que d'habitude. Vous pouvez fermer cette
          page — votre plan sera activé dès que le paiement est confirmé.
        </p>
      )}
      <div className="mt-8 w-56 progress-bar">
        <span style={{ width: `${Math.min(90, 30 + tries * 8)}%` }} />
      </div>
      <Link href="/assessment" className="mt-8 text-sm text-ink-muted">
        Retour à mon analyse
      </Link>
    </main>
  );
}
