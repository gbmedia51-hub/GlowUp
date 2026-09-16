"use client";
import { useState } from "react";

function Row({
  label,
  done,
  onToggle,
}: {
  label: string;
  done: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="check-row w-full text-left"
      data-done={done ? "true" : "false"}
    >
      <span className="box">{done ? "✓" : ""}</span>
      <span className="label text-ink">{label}</span>
    </button>
  );
}

export function TodayClient({
  programId,
  day,
  morning,
  makeup,
  evening,
  tip,
  initial,
}: {
  programId: string;
  day: number;
  morning: string[];
  makeup: string;
  evening: string[];
  tip: string;
  initial: { morning_done: boolean; makeup_done: boolean; evening_done: boolean };
}) {
  const [state, setState] = useState(initial);

  async function toggle(k: keyof typeof state) {
    const next = { ...state, [k]: !state[k] };
    setState(next);
    await fetch("/api/complete-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ program_id: programId, day, ...next }),
    });
  }

  async function completeAll() {
    const next = { morning_done: true, makeup_done: true, evening_done: true };
    setState(next);
    await fetch("/api/complete-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ program_id: programId, day, ...next }),
    });
  }

  return (
    <div className="px-6">
      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">Matin</h2>
          <span className="text-xs text-ink-muted">{morning.length} gestes</span>
        </div>
        <div className="mt-3 space-y-2">
          <Row
            label={morning.join(" · ")}
            done={state.morning_done}
            onToggle={() => toggle("morning_done")}
          />
        </div>
      </section>

      {makeup && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl text-ink">Maquillage & allure</h2>
          </div>
          <div className="mt-3 space-y-2">
            <Row
              label={makeup}
              done={state.makeup_done}
              onToggle={() => toggle("makeup_done")}
            />
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">Soir</h2>
          <span className="text-xs text-ink-muted">{evening.length} gestes</span>
        </div>
        <div className="mt-3 space-y-2">
          <Row
            label={evening.join(" · ")}
            done={state.evening_done}
            onToggle={() => toggle("evening_done")}
          />
        </div>
      </section>

      {tip && (
        <section className="mt-6 card p-5 relative overflow-hidden">
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(231,180,168,0.6), transparent 70%)",
            }}
          />
          <span className="pill">Astuce du jour</span>
          <p className="mt-3 text-ink leading-relaxed">{tip}</p>
        </section>
      )}

      <div className="mt-6">
        <button onClick={completeAll} className="btn-primary">
          ✓ Terminer la journée
        </button>
      </div>
    </div>
  );
}
