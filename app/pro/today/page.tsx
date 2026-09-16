import Link from "next/link";
import { BottomNav } from "../BottomNav";
import { requireUser } from "@/lib/supabase/server";
import { TodayClient } from "./TodayClient";

function dayIndex(startDate: string) {
  const start = new Date(startDate + "T00:00:00Z");
  const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.max(1, Math.min(30, diff + 1));
}

export default async function TodayPage() {
  const { supabase, user } = await requireUser();

  const [{ data: program }, { data: sub }] = await Promise.all([
    supabase
      .from("programs")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (!program) {
    return (
      <main className="min-h-screen bg-bg px-6 pt-16 pb-10 flex flex-col items-center text-center">
        <h1 className="font-display text-2xl text-ink">Aucun programme actif</h1>
        <p className="mt-3 text-ink-muted">
          Débloquez GlowUp Pro pour générer votre plan personnalisé.
        </p>
        <Link href="/paywall" className="btn-primary mt-6 max-w-xs">
          Débloquer Pro
        </Link>
      </main>
    );
  }

  const day = dayIndex(program.start_date);
  const dayObj = (program.days as any[])[day - 1] ?? {};

  const { data: progress } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("program_id", program.id)
    .eq("day", day)
    .maybeSingle();

  const expiresIn =
    sub && sub.expires_at
      ? Math.max(
          0,
          Math.round(
            (new Date(sub.expires_at).getTime() - Date.now()) / 86_400_000,
          ),
        )
      : null;

  return (
    <main className="min-h-screen bg-bg pb-28">
      <div className="gradient-bg px-6 pt-10 pb-8">
        <div className="flex items-center justify-between">
          <span className="pill">Aujourd'hui</span>
          <span className="text-xs text-ink-muted">
            {new Date().toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>
        </div>
        <h1 className="mt-4 font-display text-[30px] leading-tight text-ink">
          Bonjour ✨
        </h1>
        <p className="mt-1 text-ink-muted">Jour {day} de votre GlowUp de 30 jours</p>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-ink-muted mb-1">
            <span>Progression du programme</span>
            <span>{day} / 30 jours</span>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${(day / 30) * 100}%` }} />
          </div>
        </div>

        {expiresIn !== null && expiresIn <= 3 && (
          <Link
            href="/pro/renew"
            className="mt-4 block card p-3 text-sm text-ink flex items-center justify-between"
          >
            <span>
              ⏳ Votre Pro se termine dans <b>{expiresIn} jours</b>
            </span>
            <span className="text-accent">Renouveler →</span>
          </Link>
        )}
      </div>

      <TodayClient
        programId={program.id}
        day={day}
        morning={dayObj.morning ?? []}
        makeup={dayObj.makeup ?? ""}
        evening={dayObj.evening ?? []}
        tip={dayObj.tip ?? ""}
        initial={{
          morning_done: !!progress?.morning_done,
          makeup_done: !!progress?.makeup_done,
          evening_done: !!progress?.evening_done,
        }}
      />

      <BottomNav active="/pro/today" />
    </main>
  );
}
