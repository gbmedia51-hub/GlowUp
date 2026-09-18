"use client";
import { useState } from "react";

type Step =
  | string
  | {
      title?: string;
      how?: string;
      products?: string;
      why?: string;
    };

function StepCard({
  step,
  done,
  onToggle,
}: {
  step: Step;
  done: boolean;
  onToggle: () => void;
}) {
  if (typeof step === "string") {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="check-row w-full text-left"
        data-done={done ? "true" : "false"}
      >
        <span className="box">{done ? "✓" : ""}</span>
        <span className="label text-ink">{step}</span>
      </button>
    );
  }
  const title = step.title ?? "Étape";
  return (
    <div className="card p-4" data-done={done ? "true" : "false"}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 text-left"
      >
        <span
          className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center text-xs font-semibold"
          style={{
            borderColor: done ? "#B45C4D" : "#D8C6B8",
            background: done ? "#B45C4D" : "#fff",
            color: done ? "#fff" : "transparent",
          }}
        >
          {done ? "✓" : ""}
        </span>
        <span className="flex-1">
          <span
            className="block font-medium text-ink leading-tight"
            style={{ textDecoration: done ? "line-through" : "none" }}
          >
            {title}
          </span>
          {step.how && (
            <span className="mt-1.5 block text-sm text-ink-muted leading-relaxed">
              {step.how}
            </span>
          )}
          {step.products && (
            <span className="mt-2 block text-sm text-ink bg-rose/20 rounded-md px-2.5 py-1.5">
              <b className="text-accent-dark">Avec quoi&nbsp;:</b> {step.products}
            </span>
          )}
          {step.why && (
            <span className="mt-2 block text-xs italic text-ink-muted">
              → {step.why}
            </span>
          )}
        </span>
      </button>
    </div>
  );
}

function normalize(v: any): Step[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return [v]; // single object (e.g., makeup)
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
  morning: any;
  makeup: any;
  evening: any;
  tip: string;
  initial: { morning_done: boolean; makeup_done: boolean; evening_done: boolean };
}) {
  const [state, setState] = useState(initial);
  const morningSteps = normalize(morning);
  const makeupSteps = normalize(makeup);
  const eveningSteps = normalize(evening);

  async function persist(next: typeof state) {
    setState(next);
    await fetch("/api/complete-day", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ program_id: programId, day, ...next }),
    });
  }

  return (
    <div className="px-6">
      {morningSteps.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-xl text-ink">Matin</h2>
          <div className="mt-3 space-y-2">
            {morningSteps.map((s, i) => (
              <StepCard
                key={i}
                step={s}
                done={state.morning_done}
                onToggle={() =>
                  persist({ ...state, morning_done: !state.morning_done })
                }
              />
            ))}
          </div>
        </section>
      )}

      {makeupSteps.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-xl text-ink">Maquillage & allure</h2>
          <div className="mt-3 space-y-2">
            {makeupSteps.map((s, i) => (
              <StepCard
                key={i}
                step={s}
                done={state.makeup_done}
                onToggle={() =>
                  persist({ ...state, makeup_done: !state.makeup_done })
                }
              />
            ))}
          </div>
        </section>
      )}

      {eveningSteps.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-xl text-ink">Soir</h2>
          <div className="mt-3 space-y-2">
            {eveningSteps.map((s, i) => (
              <StepCard
                key={i}
                step={s}
                done={state.evening_done}
                onToggle={() =>
                  persist({ ...state, evening_done: !state.evening_done })
                }
              />
            ))}
          </div>
        </section>
      )}

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
        <button
          onClick={() =>
            persist({ morning_done: true, makeup_done: true, evening_done: true })
          }
          className="btn-primary"
        >
          ✓ Terminer la journée
        </button>
      </div>
    </div>
  );
}
