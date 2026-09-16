"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    router.push("/pro/today");
  }

  return (
    <main className="min-h-screen bg-bg px-6 pt-10 pb-8 flex flex-col">
      <Link href="/" className="text-sm text-ink-muted">
        ← Retour
      </Link>
      <div className="mt-8 flex-1">
        <span className="pill">Connexion</span>
        <h1 className="mt-3 font-display text-[30px] text-ink">Content de vous revoir</h1>
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
            <span className="text-sm text-ink-muted">Mot de passe</span>
            <input
              type="password"
              required
              autoComplete="current-password"
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
            {busy ? "Connexion…" : "Se connecter"}
          </button>
          <p className="text-center text-xs text-ink-muted">
            Pas encore de compte ?{" "}
            <Link href="/auth/signup" className="text-accent">
              Créer un compte
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
