import Link from "next/link";
import { redirectIfActiveSub } from "@/lib/supabase/server";

export default async function LandingPage() {
  await redirectIfActiveSub();
  return (
    <main className="gradient-bg min-h-screen px-6 pt-14 pb-10 flex flex-col">
      <header className="flex items-center justify-between">
        <span className="pill">Beauté · IA</span>
        <span className="text-xs text-ink-muted">v0.1</span>
      </header>

      <section className="mt-14 flex-1">
        <h1 className="font-display text-[64px] leading-[0.95] tracking-tight text-ink">
          Glow<span className="text-accent">Up</span>
        </h1>
        <p className="mt-5 font-display text-2xl leading-snug text-ink">
          Perfectionnez votre allure.
        </p>
        <p className="mt-5 text-ink-muted leading-relaxed">
          Découvrez ce qui vous met en valeur et recevez un plan personnalisé,
          jour après jour, pour révéler votre meilleure version.
        </p>

        <ul className="mt-10 space-y-3">
          {[
            "Analyse personnalisée à partir d'un selfie",
            "Palette de couleurs, maquillage & soins",
            "Programme quotidien de 30 jours",
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 text-ink">
              <span className="mt-1 h-5 w-5 rounded-full bg-rose/60 border border-accent/30 flex items-center justify-center text-accent text-xs">
                ✦
              </span>
              <span className="leading-relaxed">{t}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="pt-6 space-y-3">
        <Link href="/onboarding" className="btn-primary">
          Perfectionner mon allure
          <span aria-hidden>→</span>
        </Link>
        <p className="text-center text-xs text-ink-muted">
          Aucun compte requis pour commencer
        </p>
      </div>
    </main>
  );
}
