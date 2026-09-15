import Link from "next/link";
import { BottomNav } from "../BottomNav";

function Row({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="check-row" data-done={done ? "true" : "false"}>
      <span className="box">{done ? "✓" : ""}</span>
      <span className="label text-ink">{label}</span>
    </div>
  );
}

function Group({ title, meta, children }: any) {
  return (
    <section className="mt-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {meta && <span className="text-xs text-ink-muted">{meta}</span>}
      </div>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

export default function TodayPage() {
  const day = 12;
  const total = 30;
  const pct = Math.round((day / total) * 100);
  return (
    <main className="min-h-screen bg-bg pb-28">
      <div className="gradient-bg px-6 pt-10 pb-8">
        <div className="flex items-center justify-between">
          <span className="pill">Aujourd'hui</span>
          <span className="text-xs text-ink-muted">Mardi 15 sept.</span>
        </div>
        <h1 className="mt-4 font-display text-[30px] leading-tight text-ink">
          Bonjour Aïcha ✨
        </h1>
        <p className="mt-1 text-ink-muted">
          Jour {day} de votre GlowUp de 30 jours
        </p>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>Progression du programme</span>
            <span>
              {day} / {total} jours
            </span>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-6">
        <Group title="Matin" meta="3 gestes · ~5 min">
          <Row label="Nettoyant doux à l'eau tiède" done />
          <Row label="Sérum vitamine C (2 gouttes)" done />
          <Row label="Crème hydratante + SPF 30" />
        </Group>

        <Group title="Maquillage & allure" meta="1 geste">
          <Row label="Blush pêche + baume terracotta sur les lèvres" />
        </Group>

        <Group title="Soir" meta="2 gestes · ~4 min">
          <Row label="Nettoyage huile puis mousse (double nettoyage)" />
          <Row label="Crème hydratante + baume yeux" />
        </Group>

        <section className="mt-6 card p-5 relative overflow-hidden">
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(231,180,168,0.6), transparent 70%)",
            }}
          />
          <span className="pill">Astuce du jour</span>
          <p className="mt-3 text-ink leading-relaxed">
            Après le SPF, tapotez du bout des doigts sur la zone T pendant
            30 secondes — la texture accroche mieux et brille moins vers midi.
          </p>
        </section>

        <div className="mt-6">
          <Link href="/pro/progress" className="btn-primary">
            ✓ Terminer la journée
          </Link>
        </div>
      </div>

      <BottomNav active="/pro/today" />
    </main>
  );
}
