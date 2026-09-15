"use client";
import Link from "next/link";
import { ReactNode } from "react";

export function OnboardingShell({
  step,
  total,
  title,
  subtitle,
  children,
  next,
  back,
  nextLabel = "Continuer",
  disabled = false,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  next: string;
  back?: string;
  nextLabel?: string;
  disabled?: boolean;
}) {
  const pct = Math.round((step / total) * 100);
  return (
    <main className="min-h-screen px-6 pt-10 pb-8 flex flex-col bg-bg">
      <header className="flex items-center justify-between text-ink-muted text-sm">
        {back ? (
          <Link href={back} aria-label="Retour">
            ← Retour
          </Link>
        ) : (
          <span />
        )}
        <span>
          Étape {step} / {total}
        </span>
      </header>

      <div className="mt-4 progress-bar">
        <span style={{ width: `${pct}%` }} />
      </div>

      <section className="mt-8 flex-1">
        <h1 className="font-display text-[32px] leading-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-3 text-ink-muted leading-relaxed">{subtitle}</p>}
        <div className="mt-8 space-y-3">{children}</div>
      </section>

      <div className="pt-6">
        <Link
          href={next}
          aria-disabled={disabled}
          className="btn-primary"
          style={disabled ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        >
          {nextLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}

export function Choice({
  label,
  selected,
  multi = false,
}: {
  label: string;
  selected?: boolean;
  multi?: boolean;
}) {
  return (
    <button className="choice" data-selected={selected ? "true" : "false"} type="button">
      <span className="label">{label}</span>
      {multi ? (
        <span
          className="dot"
          style={{
            borderRadius: 6,
            width: 22,
            height: 22,
          }}
        />
      ) : (
        <span className="dot" />
      )}
    </button>
  );
}
