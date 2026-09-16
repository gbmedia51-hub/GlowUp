"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  onNext,
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
  onNext?: () => void;
}) {
  const router = useRouter();
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
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onNext?.();
            router.push(next);
          }}
          className="btn-primary"
          style={disabled ? { opacity: 0.5, pointerEvents: "none" } : undefined}
        >
          {nextLabel}
          <span aria-hidden>→</span>
        </button>
      </div>
    </main>
  );
}

export function Choice({
  label,
  hint,
  selected,
  multi = false,
  onClick,
}: {
  label: string;
  hint?: string;
  selected?: boolean;
  multi?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className="choice"
      data-selected={selected ? "true" : "false"}
      type="button"
      onClick={onClick}
    >
      <span>
        <span className="label block">{label}</span>
        {hint && <span className="block text-xs text-ink-muted mt-0.5">{hint}</span>}
      </span>
      {multi ? (
        <span className="dot" style={{ borderRadius: 6, width: 22, height: 22 }} />
      ) : (
        <span className="dot" />
      )}
    </button>
  );
}
