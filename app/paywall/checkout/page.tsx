"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// TEMPORARY: this page runs the mock-purchase flow so the full journey works
// end-to-end. Once Monetbil is wired, this page will initialize a real
// Monetbil session and redirect to their hosted checkout.

export default function CheckoutPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "paying" | "generating" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function unlock() {
    try {
      setError(null);
      setPhase("paying");
      const p = await fetch("/api/mock-purchase", { method: "POST" });
      if (!p.ok) throw new Error("payment_failed");

      setPhase("generating");
      const g = await fetch("/api/generate-program", { method: "POST" });
      if (!g.ok) throw new Error("program_failed");

      router.push("/pro/today");
    } catch (e: any) {
      setPhase("error");
      setError(
        e?.message === "program_failed"
          ? "Le programme n'a pas pu être généré. Réessayez."
          : "Le paiement de test a échoué. Réessayez.",
      );
    }
  }

  useEffect(() => {
    // auto-run on mount
    unlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-bg px-6 pt-16 pb-10 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-full bg-rose/40 border border-accent/20 flex items-center justify-center text-3xl">
        ✦
      </div>
      <h1 className="mt-6 font-display text-[26px] text-ink">
        {phase === "paying" && "Confirmation du paiement…"}
        {phase === "generating" && "Génération de votre programme…"}
        {phase === "error" && "Un souci est survenu"}
      </h1>
      <p className="mt-3 text-ink-muted max-w-xs">
        {phase === "paying" &&
          "Mode démonstration : le paiement Monetbil n'est pas encore actif."}
        {phase === "generating" &&
          "L'IA prépare votre plan personnalisé de 30 jours."}
        {phase === "error" && error}
      </p>
      {phase === "error" && (
        <div className="mt-6 space-y-2 w-full max-w-xs">
          <button onClick={unlock} className="btn-primary">
            Réessayer
          </button>
          <Link href="/paywall" className="btn-ghost">
            Retour
          </Link>
        </div>
      )}
      {phase !== "error" && (
        <div className="mt-8 w-56 progress-bar">
          <span style={{ width: phase === "generating" ? "80%" : "40%" }} />
        </div>
      )}
    </main>
  );
}
