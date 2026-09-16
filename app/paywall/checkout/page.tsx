"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [phase, setPhase] = useState<"idle" | "creating" | "redirecting" | "error">(
    "creating",
  );
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setPhase("creating");
    try {
      const r = await fetch("/api/monetbil/init", { method: "POST" });
      const data = await r.json();
      if (!r.ok || !data.redirect_url) {
        throw new Error(data.error || "init_failed");
      }
      setPhase("redirecting");
      // Give the UI a beat, then send them to Monetbil's hosted page.
      setTimeout(() => {
        window.location.href = data.redirect_url;
      }, 500);
    } catch (e: any) {
      setPhase("error");
      setError(
        "Impossible d'initialiser le paiement. Réessayez dans un instant.",
      );
    }
  }

  useEffect(() => {
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-bg px-6 pt-16 pb-10 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-rose/40 border border-accent/20 flex items-center justify-center text-3xl">
        ✦
      </div>
      <h1 className="mt-6 font-display text-[26px] text-ink">
        {phase === "creating" && "Préparation du paiement…"}
        {phase === "redirecting" && "Redirection vers Monetbil…"}
        {phase === "error" && "Un souci est survenu"}
      </h1>
      <p className="mt-3 text-ink-muted max-w-xs">
        {phase === "creating" &&
          "Un instant, on ouvre la page de paiement sécurisée."}
        {phase === "redirecting" &&
          "Vous allez être redirigé·e pour finaliser 1 999 FCFA · MTN MoMo, Orange Money ou carte."}
        {phase === "error" && error}
      </p>
      {phase === "error" && (
        <div className="mt-6 space-y-2 w-full max-w-xs">
          <button onClick={start} className="btn-primary">
            Réessayer
          </button>
          <Link href="/paywall" className="btn-ghost">
            Retour
          </Link>
        </div>
      )}
      {phase !== "error" && (
        <div className="mt-8 w-56 progress-bar">
          <span style={{ width: phase === "redirecting" ? "90%" : "40%" }} />
        </div>
      )}
    </main>
  );
}
