"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { readAssessment } from "@/lib/onboarding-store";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="font-display text-xl text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function AssessmentPage() {
  const [a, setA] = useState<any | null | undefined>(undefined);
  useEffect(() => setA(readAssessment()), []);

  if (a === undefined)
    return <main className="p-8 text-ink-muted">Chargement…</main>;
  if (!a)
    return (
      <main className="p-8">
        <p className="text-ink">Aucune évaluation trouvée.</p>
        <Link href="/selfie" className="btn-primary mt-6">
          Refaire l'analyse
        </Link>
      </main>
    );

  const score = a.score ?? 70;
  const breakdown = a.score_breakdown ?? {};
  const palette = a.color_profile?.palette ?? [];

  return (
    <main className="min-h-screen bg-bg pb-10">
      <div className="gradient-bg px-6 pt-10 pb-8">
        <span className="pill">Analyse gratuite</span>
        <h1 className="mt-3 font-display text-[30px] leading-tight text-ink">
          Votre profil GlowUp
        </h1>
        <p className="mt-2 text-ink-muted leading-relaxed">{a.summary}</p>

        <div className="mt-6 card p-5 flex items-center gap-5">
          <div className="score-ring" style={{ ["--v" as any]: score }}>
            <div>
              <div className="font-display text-4xl text-ink leading-none">{score}</div>
              <div className="text-xs text-ink-muted mt-1">GlowUp Score</div>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-ink-muted">Répartition</p>
            <ul className="mt-2 space-y-2 text-sm">
              {[
                ["Peau", breakdown.skin],
                ["Maquillage", breakdown.makeup],
                ["Grooming", breakdown.grooming],
                ["Présentation", breakdown.presentation],
              ].map(([n, v]: any) =>
                typeof v === "number" ? (
                  <li key={n}>
                    <div className="flex justify-between text-ink">
                      <span>{n}</span>
                      <span className="text-ink-muted">{v}</span>
                    </div>
                    <div className="progress-bar mt-1">
                      <span style={{ width: `${v}%` }} />
                    </div>
                  </li>
                ) : null,
              )}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Ce score est un repère personnel généré par l'IA — pas une note
          d'attractivité.
        </p>
      </div>

      <div className="px-6">
        {(a.face_shape || a.facial_features) && (
          <Section title="Analyse du visage">
            <div className="card p-4 space-y-2 text-sm text-ink">
              {a.face_shape && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">Forme du visage</span>
                  <span>{a.face_shape}</span>
                </div>
              )}
              {a.facial_features && (
                <div className="flex justify-between gap-3">
                  <span className="text-ink-muted">Traits</span>
                  <span className="text-right">{a.facial_features}</span>
                </div>
              )}
            </div>
          </Section>
        )}

        {Array.isArray(a.skin_observations) && a.skin_observations.length > 0 && (
          <Section title="Observations peau">
            <ul className="space-y-2 text-ink text-sm">
              {a.skin_observations.map((s: string, i: number) => (
                <li key={i} className="flex gap-2">
                  <span className="text-accent">•</span> {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {a.color_profile && (
          <Section title="Profil couleur">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-ink-muted">
                    Direction
                  </p>
                  <p className="font-display text-2xl text-ink">
                    {a.color_profile.direction ?? "—"}
                  </p>
                </div>
                {a.color_profile.season && (
                  <span className="pill">{a.color_profile.season}</span>
                )}
              </div>
              {palette.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {palette.map((c: any) => (
                    <span key={c.hex} className="chip">
                      <span className="swatch" style={{ background: c.hex }} />
                      {c.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Section>
        )}

        {a.makeup && (
          <Section title="Maquillage">
            <div className="card p-4 space-y-3 text-sm text-ink">
              {[
                ["Style", a.makeup.style],
                ["Lèvres", a.makeup.lips],
                ["Blush", a.makeup.blush],
                ["Yeux", a.makeup.eyes],
                ["Teint", a.makeup.base],
              ].map(([k, v]: any) =>
                v ? (
                  <div key={k} className="flex justify-between gap-4">
                    <span className="text-ink-muted">{k}</span>
                    <span className="text-right">{v}</span>
                  </div>
                ) : null,
              )}
            </div>
          </Section>
        )}

        {Array.isArray(a.opportunities) && a.opportunities.length > 0 && (
          <Section title="Top opportunités GlowUp">
            <ol className="space-y-3">
              {a.opportunities.map((t: string, i: number) => (
                <li key={i} className="card p-4 flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                    {i + 1}
                  </span>
                  <span className="text-ink leading-relaxed">{t}</span>
                </li>
              ))}
            </ol>
          </Section>
        )}

        <div className="mt-8">
          <Link href="/paywall" className="btn-primary">
            Débloquer mon plan personnalisé →
          </Link>
        </div>
      </div>
    </main>
  );
}
