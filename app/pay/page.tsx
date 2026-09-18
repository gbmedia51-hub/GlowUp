"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ensureSession } from "@/lib/supabase/browser";

type Operator = "mtn_momo" | "orange_money";

const OPERATORS: {
  id: Operator;
  name: string;
  hint: string;
  logo: string;
  bg: string;
}[] = [
  {
    id: "mtn_momo",
    name: "MTN Mobile Money",
    hint: "6XX XXX XXX",
    logo: "MoMo",
    bg: "#FFCC00",
  },
  {
    id: "orange_money",
    name: "Orange Money",
    hint: "6XX XXX XXX",
    logo: "OM",
    bg: "#FF7900",
  },
];

export default function PayPage() {
  const router = useRouter();
  const [op, setOp] = useState<Operator | null>(null);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // If the user already has an active sub, jump straight to /pro/today.
  useEffect(() => {
    (async () => {
      try {
        await ensureSession();
        const r = await fetch("/api/payments/status?id=none");
        if (r.ok) {
          const j = await r.json();
          if (j?.subscription_active) router.replace("/pro/today");
        }
      } catch {
        /* ignore */
      }
    })();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!op) {
      setError("Choisissez un opérateur.");
      return;
    }
    const digits = phone.replace(/\D+/g, "");
    if (!/^[0-9]{8,15}$/.test(digits)) {
      setError("Numéro invalide.");
      return;
    }
    setBusy(true);
    try {
      await ensureSession();
      const res = await fetch("/api/payments/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: op, phone: digits }),
      });
      const data = await res.json();
      if (!res.ok) {
        const suffix = data?.detail ? ` — ${data.detail}` : "";
        setError(`Impossible d'initier le paiement.${suffix}`);
        setBusy(false);
        return;
      }
      // Some providers return a hosted-checkout URL — redirect instead of polling.
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
        return;
      }
      setPending(data.payment_id);
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau.");
      setBusy(false);
    }
  }

  // Once we have a pending id, poll every 5s to see if the webhook
  // has flipped the subscription active.
  useEffect(() => {
    if (!pending) return;
    let done = false;
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/payments/status?id=${pending}`);
        const j = await r.json();
        if (j?.subscription_active && !done) {
          done = true;
          clearInterval(t);
          router.replace("/pro/today");
        }
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [pending, router]);

  if (pending) {
    return (
      <main className="min-h-screen bg-bg px-6 pt-16 pb-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-rose/40 border border-accent/20 flex items-center justify-center text-3xl">
          📲
        </div>
        <h1 className="mt-6 font-display text-[26px] text-ink">
          Vérifiez votre téléphone
        </h1>
        <p className="mt-3 text-ink-muted max-w-xs">
          Une demande de paiement de <b className="text-ink">1 999 FCFA</b> a été
          envoyée sur votre numéro. Ouvrez la notification Mobile Money et
          confirmez avec votre code secret.
        </p>
        <p className="mt-3 text-xs text-ink-muted max-w-xs">
          Cette page se rafraîchit automatiquement — vous serez redirigé·e vers
          votre plan dès la confirmation.
        </p>
        <div className="mt-6 w-56 progress-bar">
          <span style={{ width: "60%" }} />
        </div>
        <Link href="/assessment" className="mt-8 text-sm text-ink-muted">
          Annuler et retourner à mon analyse
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg pb-8">
      <div className="gradient-bg px-6 pt-10 pb-6">
        <Link href="/paywall" className="text-sm text-ink-muted">
          ← Retour
        </Link>
        <div className="mt-6">
          <span className="pill">Paiement</span>
          <h1 className="mt-3 font-display text-[30px] leading-tight text-ink">
            Débloquer GlowUp Pro
          </h1>
          <p className="mt-2 text-ink-muted">
            Payez avec MTN Mobile Money ou Orange Money.
          </p>
        </div>

        <div className="mt-6 card p-5">
          <p className="text-xs uppercase tracking-widest text-ink-muted">Total</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-4xl text-ink">1 999</span>
            <span className="text-ink-muted">FCFA</span>
            <span className="ml-auto text-xs text-ink-muted">30 jours</span>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="px-6 pt-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink-muted mb-2">
            Choisissez un opérateur
          </p>
          <div className="grid grid-cols-2 gap-3">
            {OPERATORS.map((o) => (
              <button
                type="button"
                key={o.id}
                onClick={() => setOp(o.id)}
                data-selected={op === o.id ? "true" : "false"}
                className="choice flex-col items-start gap-2 py-4 text-left"
              >
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: o.bg, color: o.id === "mtn_momo" ? "#000" : "#fff" }}
                >
                  {o.logo}
                </span>
                <span className="label">{o.name}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="text-xs uppercase tracking-widest text-ink-muted">
            Votre numéro
          </span>
          <input
            type="tel"
            inputMode="numeric"
            required
            placeholder={op ? OPERATORS.find((o) => o.id === op)?.hint : "6XX XXX XXX"}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full card px-4 py-3 outline-none text-ink text-lg tracking-wide"
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Format international sans le +, ou local à 9 chiffres.
          </span>
        </label>

        {error && (
          <p className="text-sm text-accent-dark bg-rose/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-primary"
          style={busy ? { opacity: 0.6 } : undefined}
        >
          {busy ? "Traitement…" : "Payer 1 999 FCFA"}
        </button>

        <p className="text-center text-xs text-ink-muted">
          🔒 Vous confirmerez le paiement sur votre téléphone
        </p>
      </form>
    </main>
  );
}
