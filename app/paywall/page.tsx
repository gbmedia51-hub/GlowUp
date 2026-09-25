import Link from "next/link";
import { redirectIfActiveSub } from "@/lib/supabase/server";
import { UnlockButton } from "./UnlockButton";

const features = [
  ["Programme soins personnalisé", "Adapté à votre peau et à vos objectifs"],
  ["Guidage quotidien", "Que faire, matin et soir, en 30 jours"],
  ["Routine maquillage sur-mesure", "Étape par étape, adaptée à votre look"],
  ["Palette couleurs personnalisée", "Les teintes qui vous mettent en valeur"],
  ["Conseils grooming", "Sourcils, peau, présentation globale"],
  ["Suivi de progression", "Série, régularité, jours accomplis"],
  ["Assistant Ask GlowUp", "Une IA qui répond à vos questions beauté"],
];

// Server-rendered on purpose so the page renders even if the browser Supabase
// client fails to initialize. The signup page handles the "already signed in"
// case by skipping straight to /paywall/checkout.
export default async function PaywallPage() {
  await redirectIfActiveSub();
  return (
    <main className="min-h-screen bg-bg pb-8">
      <div className="gradient-bg px-6 pt-10 pb-8">
        <Link href="/assessment" className="text-sm text-ink-muted">
          ← Retour
        </Link>
        <div className="mt-6">
          <span className="pill">GlowUp Pro</span>
          <h1 className="mt-4 font-display text-[34px] leading-tight text-ink">
            Prêt·e à perfectionner votre allure ?
          </h1>
          <p className="mt-3 text-ink-muted leading-relaxed">
            Votre analyse a révélé le potentiel. Pro le transforme en un plan
            jour après jour, entièrement personnalisé.
          </p>
        </div>

        <div className="mt-6 card p-6 relative overflow-hidden">
          <span className="absolute top-4 right-4 pill">30 jours</span>
          <p className="text-xs uppercase tracking-widest text-ink-muted">GlowUp Pro</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-5xl text-ink">1 999</span>
            <span className="text-ink-muted">FCFA</span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            Routine complète de 30 jours. Pas de prélèvement automatique — vous
            payez à nouveau seulement si vous souhaitez continuer.
          </p>
        </div>
      </div>

      <div className="px-6">
        <ul className="mt-4 space-y-3">
          {features.map(([t, s]) => (
            <li key={t} className="card p-4 flex gap-3">
              <span className="w-8 h-8 rounded-full bg-rose/50 border border-accent/20 flex items-center justify-center text-accent">
                ✦
              </span>
              <div>
                <p className="font-medium text-ink">{t}</p>
                <p className="text-sm text-ink-muted">{s}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-3">
          <UnlockButton label="Débloquer GlowUp Pro · 1 999 FCFA →" />
          <p className="text-center text-xs text-ink-muted">
            Paiement sécurisé — vous serez redirigé·e vers SasPay pour
            confirmer.
          </p>
        </div>
      </div>
    </main>
  );
}
