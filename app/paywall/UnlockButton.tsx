"use client";
import { useState } from "react";

export function UnlockButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/payments/init", { method: "POST" });
      const data = await r.json();
      if (!r.ok || !data?.redirect_url) {
        const suffix = data?.detail ? ` — ${data.detail}` : "";
        setError(`Impossible d'initier le paiement.${suffix}`);
        setBusy(false);
        return;
      }
      window.location.href = data.redirect_url;
    } catch (e: any) {
      setError("Connexion impossible. Vérifiez votre réseau.");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={go}
        disabled={busy}
        className="btn-primary"
        style={busy ? { opacity: 0.6 } : undefined}
      >
        {busy ? "Redirection…" : label}
      </button>
      {error && (
        <p className="text-sm text-accent-dark bg-rose/20 rounded-lg px-3 py-2 mt-2">
          {error}
        </p>
      )}
    </>
  );
}
