import Link from "next/link";
import { BottomNav } from "../BottomNav";
import { requireUser } from "@/lib/supabase/server";

function dayIndex(startDate: string) {
  const start = new Date(startDate + "T00:00:00Z");
  const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.max(1, Math.min(30, diff + 1));
}

function computeStreak(daysDone: Set<number>, today: number) {
  let streak = 0;
  for (let d = today - 1; d >= 1; d--) {
    if (daysDone.has(d)) streak++;
    else break;
  }
  if (daysDone.has(today)) streak++;
  return streak;
}

export default async function ProgressPage() {
  const { supabase, user } = await requireUser();

  const { data: program } = await supabase
    .from("programs")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .maybeSingle();

  if (!program) {
    return (
      <main className="min-h-screen bg-bg px-6 pt-16 pb-10 text-center">
        <h1 className="font-display text-2xl text-ink">Aucun programme actif</h1>
        <Link href="/paywall" className="btn-primary mt-6 max-w-xs">
          Débloquer Pro
        </Link>
      </main>
    );
  }

  const today = dayIndex(program.start_date);
  const { data: progressRows } = await supabase
    .from("daily_progress")
    .select("day, completed_at")
    .eq("program_id", program.id);

  const doneSet = new Set<number>(
    (progressRows ?? []).filter((r) => r.completed_at).map((r) => r.day),
  );
  const doneCount = doneSet.size;
  const streak = computeStreak(doneSet, today);
  const total = 30;
  const pct = Math.round((today / total) * 100);
  const consistency = today > 1 ? Math.round((doneCount / Math.max(1, today - 1)) * 100) : 100;

  const cells = Array.from({ length: total }, (_, i) => {
    const d = i + 1;
    if (doneSet.has(d)) return "done";
    if (d === today) return "today";
    if (d < today) return "skip";
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
              <p className="text-xs uppercase tracking-widest text-ink-muted">Jour</p>
              <p className="font-display text-4xl text-ink">
                {today}
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
            {doneCount} jours accomplis · {total - today} restants
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
                  style={{ background: bg, color, border: `1.5px solid ${border}` }}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid grid-cols-3 gap-3">
          {[
            [String(doneCount), "Jours"],
            [`${consistency}%`, "Régularité"],
            [String(streak), "Série"],
          ].map(([v, l]) => (
            <div key={l} className="card p-4 text-center">
              <p className="font-display text-2xl text-ink">{v}</p>
              <p className="text-xs text-ink-muted mt-1">{l}</p>
            </div>
          ))}
        </section>
      </div>

      <BottomNav active="/pro/progress" />
    </main>
  );
}
