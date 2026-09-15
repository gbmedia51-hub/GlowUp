import Link from "next/link";

export default function SelfiePage() {
  return (
    <main className="min-h-screen px-6 pt-10 pb-8 flex flex-col bg-bg">
      <header className="flex items-center justify-between text-ink-muted text-sm">
        <Link href="/onboarding/budget">← Retour</Link>
        <span>Analyse</span>
      </header>

      <section className="mt-10 flex-1">
        <span className="pill">Étape finale</span>
        <h1 className="mt-4 font-display text-[34px] leading-tight text-ink">
          Analysons votre allure
        </h1>
        <p className="mt-3 text-ink-muted leading-relaxed">
          Prenez ou importez une photo claire de votre visage. Elle est analysée
          en toute confidentialité, puis immédiatement supprimée de nos serveurs.
        </p>

        <div className="mt-8 card p-6">
          <div
            className="w-full aspect-[4/5] rounded-xl2 border-2 border-dashed border-line flex flex-col items-center justify-center text-center px-6"
            style={{
              background:
                "radial-gradient(240px 240px at 50% 45%, rgba(231,180,168,0.35), transparent 70%)",
            }}
          >
            <div className="w-24 h-24 rounded-full bg-rose/40 border border-accent/20 flex items-center justify-center text-4xl">
              📸
            </div>
            <p className="mt-5 font-display text-xl text-ink">
              Prendre un selfie
            </p>
            <p className="mt-2 text-sm text-ink-muted max-w-[240px]">
              ou glissez une photo depuis votre téléphone
            </p>
          </div>

          <ul className="mt-6 space-y-2 text-sm text-ink">
            {[
              "Visage bien visible",
              "Bonne lumière naturelle",
              "Pas de filtre marqué",
              "Regard vers l'objectif",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="text-accent">✓</span> {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="pt-6 space-y-2">
        <Link href="/assessment" className="btn-primary">
          Analyser ma photo
          <span aria-hidden>→</span>
        </Link>
        <p className="text-center text-xs text-ink-muted">
          🔒 Photo supprimée immédiatement après l'analyse
        </p>
      </div>
    </main>
  );
}
