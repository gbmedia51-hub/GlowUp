import Link from "next/link";
import { BottomNav } from "../BottomNav";

export default function RenewPage() {
  return (
    <main className="min-h-screen bg-bg pb-28">
      <div className="gradient-bg px-6 pt-10 pb-8">
        <Link href="/pro/today" className="text-sm text-ink-muted">
          ← Retour
        </Link>

        <div className="mt-8 card p-6 relative overflow-hidden">
          <div
            className="absolute -right-10 -top-10 w-40 h-40 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(180,92,77,0.35), transparent 70%)",
            }}
          />
          <span className="pill">Renouvellement</span>
          <h1 className="mt-4 font-display text-[28px] leading-tight text-ink">
            Votre GlowUp Pro se termine bientôt
          </h1>
          <p className="mt-3 text-ink-muted leading-relaxed">
            Il vous reste <b className="text-ink">2 jours</b> avant l'expiration
            de votre plan. Renouvelez pour continuer sans interruption — un
            nouveau programme 30 jours sera généré à partir de votre progression.
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-display text-5xl text-ink">1 999</span>
            <span className="text-ink-muted">FCFA</span>
          </div>
          <p className="text-xs text-ink-muted">
            Paiement unique · pas de reconduction
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link href="/pro/today" className="btn-primary">
            Renouveler mon plan
            <span aria-hidden>→</span>
          </Link>
          <p className="text-center text-xs text-ink-muted">
            MTN MoMo · Orange Money · Carte bancaire
          </p>
        </div>
      </div>

      <div className="px-6">
        <section className="mt-6">
          <h2 className="font-display text-xl text-ink">Ce mois-ci, vous avez :</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              "Complété 17 jours sur 30",
              "Maintenu une série de 5 jours",
              "Progressé sur la régularité de votre routine",
            ].map((t) => (
              <li key={t} className="card p-4 flex gap-3 items-center">
                <span className="w-7 h-7 rounded-full bg-rose/50 border border-accent/20 flex items-center justify-center text-accent">
                  ✦
                </span>
                <span className="text-ink">{t}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <BottomNav active="/pro/today" />
    </main>
  );
}
