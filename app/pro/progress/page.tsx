import { BottomNav } from "../BottomNav";

export default function ProgressPage() {
  const day = 17;
  const total = 30;
  const pct = Math.round((day / total) * 100);
  const streak = 5;

  // Fake 30-day grid (17 done, one skipped on day 9)
  const cells = Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    if (d === 9) return "skip";
    if (d <= day) return "done";
    if (d === day + 1) return "today";
    return "todo";
  });

  return (
    <main className="min-h-screen bg-bg pb-28">
      <div className="gradient-bg px-6 pt-10 pb-8">
        <span className="pill">Votre progression</span>
        <h1 className="mt-3 font-display text-[30px] text-ink">
          Votre GlowUp avance ✨
        </h1>

        <div className="mt-6 card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink-muted">
                Jour
              </p>
              <p className="font-display text-4xl text-ink">
                {day}
                <span className="text-ink-muted text-2xl"> / {total}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-ink-muted">
                Série actuelle
              </p>
              <p className="font-display text-4xl text-accent">🔥 {streak}</p>
            </div>
          </div>

          <div className="mt-5 progress-bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {day} jours accomplis · {total - day} restants
          </p>
        </div>
      </div>

      <div className="px-6">
        <section className="mt-4">
          <h2 className="font-display text-xl text-ink">Vos 30 jours</h2>
          <div className="mt-3 grid grid-cols-6 gap-2">
            {cells.map((state, i) => {
              let bg = "#F1E6DA";
              let color = "#6B5E58";
              let border = "transparent";
              if (state === "done") {
                bg = "#B45C4D";
                color = "#fff";
              } else if (state === "today") {
                bg = "#fff";
                color = "#B45C4D";
                border = "#B45C4D";
              } else if (state === "skip") {
                bg = "#F5E4D0";
                color = "#8A5A3B";
              }
              return (
                <div
                  key={i}
                  className="aspect-square rounded-lg flex items-center justify-center text-sm font-medium"
                  style={{
                    background: bg,
                    color,
                    border: `1.5px solid ${border}`,
                  }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex gap-4 text-xs text-ink-muted flex-wrap">
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ background: "#B45C4D" }}
              />{" "}
              Accompli
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ background: "#fff", border: "1.5px solid #B45C4D" }}
              />{" "}
              Aujourd'hui
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ background: "#F5E4D0" }}
              />{" "}
              Sauté
            </span>
            <span className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded"
                style={{ background: "#F1E6DA" }}
              />{" "}
              À venir
            </span>
          </div>
        </section>

        <section className="mt-8 grid grid-cols-3 gap-3">
          {[
            ["17", "Jours"],
            ["94%", "Régularité"],
            ["5", "Série"],
          ].map(([v, l]) => (
            <div key={l} className="card p-4 text-center">
              <p className="font-display text-2xl text-ink">{v}</p>
              <p className="text-xs text-ink-muted mt-1">{l}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 card p-5">
          <span className="pill">Prochaine étape</span>
          <p className="mt-3 text-ink leading-relaxed">
            Semaine 3 : on introduit un exfoliant doux 2× par semaine et un
            baume lèvres teinté pour homogénéiser votre teint.
          </p>
        </section>
      </div>

      <BottomNav active="/pro/progress" />
    </main>
  );
}
