"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readOnboarding } from "@/lib/onboarding-store";
import { ensureSession } from "@/lib/supabase/browser";

async function downscale(file: File, max = 768, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

export default function SelfiePage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "process" | "analyze">(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File) {
    setError(null);
    setBusy("process");
    try {
      const dataUrl = await downscale(file);
      setPreview(dataUrl);
    } catch {
      setError("Impossible de lire cette image. Réessayez.");
    } finally {
      setBusy(null);
    }
  }

  async function analyze() {
    if (!preview) return;
    setBusy("analyze");
    setError(null);
    try {
      await ensureSession();
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding: readOnboarding(), image: preview }),
      });
      const data = await res.json();
      if (!res.ok || data.error === "no_face") {
        const suffix = data?.detail ? ` — ${data.detail}` : "";
        setError(
          data.error === "no_face"
            ? "Aucun visage détecté. Reprenez une photo bien cadrée."
            : `L'analyse a échoué. Réessayez dans un instant.${suffix}`,
        );
        setBusy(null);
        return;
      }
      router.push("/assessment");
    } catch (e: any) {
      setError(
        e?.message === "anonymous_signin_failed"
          ? "Impossible d'ouvrir une session. Activez les sign-ins anonymes dans Supabase."
          : "Connexion impossible. Vérifiez votre réseau.",
      );
      setBusy(null);
    }
  }

  return (
    <main className="min-h-screen px-6 pt-10 pb-8 flex flex-col bg-bg">
      <header className="flex items-center justify-between text-ink-muted text-sm">
        <Link href="/onboarding/budget">← Retour</Link>
        <span>Analyse</span>
      </header>

      <section className="mt-10 flex-1">
        <span className="pill">Étape finale</span>
        <h1 className="mt-4 font-display text-[34px] leading-tight text-ink">
          Analysons votre allure
        </h1>
        <p className="mt-3 text-ink-muted leading-relaxed">
          Prenez ou importez une photo claire de votre visage. Elle est analysée
          en toute confidentialité, puis immédiatement supprimée de nos serveurs.
        </p>

        <div className="mt-8 card p-6">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full aspect-[4/5] rounded-xl2 border-2 border-dashed border-line flex flex-col items-center justify-center text-center px-6 overflow-hidden relative"
            style={{
              background: preview
                ? `url(${preview}) center/cover no-repeat`
                : "radial-gradient(240px 240px at 50% 45%, rgba(231,180,168,0.35), transparent 70%)",
            }}
          >
            {!preview && (
              <>
                <div className="w-24 h-24 rounded-full bg-rose/40 border border-accent/20 flex items-center justify-center text-4xl">
                  📸
                </div>
                <p className="mt-5 font-display text-xl text-ink">Prendre un selfie</p>
                <p className="mt-2 text-sm text-ink-muted max-w-[240px]">
                  ou touchez pour importer une photo
                </p>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
            }}
          />

          <ul className="mt-6 space-y-2 text-sm text-ink">
            {[
              "Visage bien visible",
              "Bonne lumière naturelle",
              "Pas de filtre marqué",
              "Regard vers l'objectif",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="text-accent">✓</span> {t}
              </li>
            ))}
          </ul>
          {error && (
            <p className="mt-4 text-sm text-accent-dark bg-rose/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      </section>

      <div className="pt-6 space-y-2">
        <button
          type="button"
          onClick={analyze}
          disabled={!preview || busy !== null}
          className="btn-primary"
          style={!preview || busy ? { opacity: 0.5 } : undefined}
        >
          {busy === "analyze" ? "Analyse en cours…" : "Analyser ma photo →"}
        </button>
        {preview && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-ghost"
          >
            Reprendre une photo
          </button>
        )}
        <p className="text-center text-xs text-ink-muted">
          🔒 Photo supprimée immédiatement après l'analyse
        </p>
      </div>
    </main>
  );
}
