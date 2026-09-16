"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { readAssessment, readOnboarding } from "@/lib/onboarding-store";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = supabaseBrowser();
    const { error: signErr } = await supabase.auth.signUp({ email, password });
    if (signErr) {
      // If already registered, try signing in instead — friendlier UX.
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (loginErr) {
        setError(loginErr.message);
        setBusy(false);
        return;
      }
    }

    // Persist any cached free assessment to the new account.
    const assessment = readAssessment();
    if (assessment) {
      await fetch("/api/save-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding: readOnboarding(), assessment }),
      });
    }
    router.push("/paywall/checkout");
  }

  return (
    <main className="min-h-screen bg-bg px-6 pt-10 pb-8 flex flex-col">
      <Link href="/paywall" className="text-sm text-ink-muted">
        ← Retour
      </Link>
      <div className="mt-8 flex-1">
        <span className="pill">Créer un compte</span>
        <h1 className="mt-3 font-display text-[30px] text-ink">Presque prêt·e</h1>
        <p className="mt-2 text-ink-muted">
          Créez un compte pour sauvegarder votre profil et accéder à votre plan.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
          <label className="block">
            <span className="text-sm text-ink-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full card px-4 py-3 outline-none text-ink"
            />
          </label>
          <label className="block">
            <span className="text-sm text-ink-muted">Mot de passe (8 caractères min.)</span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full card px-4 py-3 outline-none text-ink"
            />
          </label>
          {error && (
            <p className="text-sm text-accent-dark bg-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="btn-primary mt-2"
            style={busy ? { opacity: 0.6 } : undefined}
          >
            {busy ? "Création…" : "Créer mon compte"}
          </button>
          <p className="text-center text-xs text-ink-muted">
            Déjà inscrit·e ?{" "}
            <Link href="/auth/login" className="text-accent">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
