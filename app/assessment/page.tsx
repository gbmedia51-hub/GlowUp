import Link from "next/link";

const palette = [
  { name: "Terracotta", hex: "#B45C4D" },
  { name: "Rose poudré", hex: "#E7B4A8" },
  { name: "Pêche", hex: "#F3C9A8" },
  { name: "Ivoire chaud", hex: "#F5E4D0" },
  { name: "Bronze doux", hex: "#8A5A3B" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function AssessmentPage() {
  const score = 72;
  return (
    <main className="min-h-screen bg-bg pb-10">
      <div className="gradient-bg px-6 pt-10 pb-8">
        <span className="pill">Analyse gratuite</span>
        <h1 className="mt-3 font-display text-[30px] leading-tight text-ink">
          Votre profil GlowUp
        </h1>
        <p className="mt-2 text-ink-muted leading-relaxed">
          Aïcha, voici ce que nous voyons — et ce qui pourrait vraiment vous
          mettre en valeur.
        </p>

        <div className="mt-6 card p-5 flex items-center gap-5">
          <div className="score-ring" style={{ ["--v" as any]: score }}>
            <div>
              <div className="font-display text-4xl text-ink leading-none">{score}</div>
              <div className="text-xs text-ink-muted mt-1">GlowUp Score</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-ink-muted">
              Répartition
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {[
                ["Peau", 68],
                ["Maquillage", 74],
                ["Grooming", 78],
                ["Présentation", 70],
              ].map(([n, v]) => (
                <li key={n as string}>
                  <div className="flex justify-between text-ink">
                    <span>{n}</span>
                    <span className="text-ink-muted">{v}</span>
                  </div>
                  <div className="progress-bar mt-1">
                    <span style={{ width: `${v}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Ce score est un repère personnel généré par l'IA — pas une note
          d'attractivité.
        </p>
      </div>

      <div className="px-6">
        <Section title="Aperçu">
          <p className="text-ink leading-relaxed">
            Votre visage a des lignes équilibrées avec une belle luminosité
            naturelle. Un rehaussement du teint et des tons chauds révéleraient
            davantage votre éclat.
          </p>
        </Section>

        <Section title="Analyse du visage">
          <div className="card p-4 space-y-2 text-sm text-ink">
            <div className="flex justify-between">
              <span className="text-ink-muted">Forme du visage</span>
              <span>Ovale</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Traits marquants</span>
              <span>Yeux, pommettes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Symétrie perçue</span>
              <span>Élevée</span>
            </div>
          </div>
        </Section>

        <Section title="Observations peau">
          <ul className="space-y-2 text-ink text-sm">
            <li className="flex gap-2">
              <span className="text-accent">•</span> Zone T légèrement brillante
            </li>
            <li className="flex gap-2">
              <span className="text-accent">•</span> Teint globalement uniforme
              avec quelques marques post-imperfections
            </li>
            <li className="flex gap-2">
              <span className="text-accent">•</span> Petites zones de
              déshydratation autour des joues
            </li>
          </ul>
        </Section>

        <Section title="Profil couleur">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-ink-muted">
                  Direction
                </p>
                <p className="font-display text-2xl text-ink">Chaud</p>
              </div>
              <span className="pill">Automne doux</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {palette.map((c) => (
                <span key={c.hex} className="chip">
                  <span className="swatch" style={{ background: c.hex }} />
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </Section>

        <Section title="Maquillage">
          <div className="card p-4 space-y-3 text-sm text-ink">
            {[
              ["Style", "Naturel lumineux, effet peau nue"],
              ["Lèvres", "Terracotta, rose brique"],
              ["Blush", "Pêche chaud"],
              ["Yeux", "Bronze doux, brun chocolat"],
              ["Teint", "Fond léger + correcteur ciblé"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-ink-muted">{k}</span>
                <span className="text-right">{v}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Top 3 opportunités GlowUp">
          <ol className="space-y-3">
            {[
              "Instaurer une routine soins quotidienne (matin & soir).",
              "Adopter des tons chauds pour lèvres et blush.",
              "Améliorer la régularité du grooming des sourcils.",
            ].map((t, i) => (
              <li key={t} className="card p-4 flex gap-3 items-start">
                <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                  {i + 1}
                </span>
                <span className="text-ink leading-relaxed">{t}</span>
              </li>
            ))}
          </ol>
        </Section>

        <div className="mt-8">
          <Link href="/paywall" className="btn-primary">
            Débloquer mon plan personnalisé
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
