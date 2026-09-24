"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { readOnboarding } from "@/lib/onboarding-store";
import { ensureSession } from "@/lib/supabase/browser";

// Two hidden file inputs: one that forces the front camera (`capture="user"`),
// one that opens the OS gallery picker. Users choose their route via the two
// buttons below the preview.

// Downscale a photo aggressively enough to fit in low-RAM phones and
// small mobile upload budgets. Tries a chain of (max, quality) settings
// and returns the first one that produces a data URL under ~900 KB.
// Releases the ImageBitmap explicitly so Chromium can reclaim memory.
async function downscale(file: File): Promise<string> {
  const attempts: Array<[number, number]> = [
    [640, 0.75],
    [512, 0.7],
    [420, 0.65],
    [360, 0.6],
  ];
  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    for (const [max, quality] of attempts) {
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      const w = Math.round(bitmap.width * scale);
      const h = Math.round(bitmap.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      try {
        ctx.drawImage(bitmap, 0, 0, w, h);
        const out = canvas.toDataURL("image/jpeg", quality);
        // free canvas backing store
        canvas.width = 0;
        canvas.height = 0;
        if (out && out.length < 900_000) return out;
        if (out && attempts.indexOf([max, quality]) === attempts.length - 1) {
          return out; // last attempt, take whatever we got
        }
      } catch {
        // canvas OOM on very low-RAM phones — try next smaller size
        continue;
      }
    }
    throw new Error("image_too_large_after_shrink");
  } finally {
    try {
      bitmap?.close?.();
    } catch {
      /* ignore */
    }
  }
}

export default function SelfiePage() {
  const router = useRouter();
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "process" | "analyze">(null);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File) {
    setError(null);
    setBusy("process");
    try {
      const dataUrl = await downscale(file);
      setPreview(dataUrl);
    } catch (e: any) {
      const msg = e?.message ?? "";
      setError(
        msg === "image_too_large_after_shrink"
          ? "Cette photo est trop lourde pour votre appareil. Essayez une photo plus petite ou fermez d'autres apps."
          : "Impossible de lire cette image. Prenez ou choisissez une autre photo.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function analyze() {
    if (!preview) return;
    setBusy("analyze");
    setError(null);
    let step: "session" | "upload" | "response" = "session";
    try {
      await ensureSession();
      step = "upload";
      const bodyStr = JSON.stringify({
        onboarding: readOnboarding(),
        image: preview,
      });
      const sizeKb = Math.round(bodyStr.length / 1024);
      const res = await fetch("/api/assess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyStr,
      }).catch((err) => {
        throw new Error(`${err?.message ?? "fetch"} (body ${sizeKb} KB)`);
      });
      step = "response";
      const data = await res.json();
      if (!res.ok || data.error === "no_face") {
        const suffix = data?.detail ? ` — ${data.detail}` : "";
        setError(
          data.error === "no_face"
            ? "On ne voit pas encore bien votre visage. Reprenez une photo centrée, dans un endroit plus lumineux, sans casque ni lunettes de soleil."
            : `L'analyse a échoué. Réessayez dans un instant.${suffix}`,
        );
        setBusy(null);
        return;
      }
      router.push("/assessment");
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "");
      const looksLikeAnonDisabled =
        /anonymous/i.test(msg) || /signup.*disabled/i.test(msg);
      setError(
        looksLikeAnonDisabled
          ? "Sessions anonymes désactivées côté Supabase. Activez-les dans Auth → Providers."
          : `Échec [${step}] : ${msg || "réseau"}`,
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
            disabled={busy === "analyze"}
            onClick={() => cameraRef.current?.click()}
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
                <p className="mt-5 font-display text-xl text-ink">
                  Ajoutez votre photo
                </p>
                <p className="mt-2 text-sm text-ink-muted max-w-[240px]">
                  Prenez un selfie ou importez depuis votre galerie
                </p>
              </>
            )}

            {/* Scan overlay while OpenAI Vision is analyzing */}
            {busy === "analyze" && preview && (
              <div
                className="scan-overlay absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(circle at center, rgba(20,10,10,0.28) 0%, rgba(20,10,10,0.55) 100%)",
                  backdropFilter: "blur(1.5px)",
                  WebkitBackdropFilter: "blur(1.5px)",
                }}
              >
                {/* Corner brackets */}
                <span
                  className="absolute top-4 left-4 w-9 h-9"
                  style={{
                    borderTop: "2px solid rgba(255,255,255,0.9)",
                    borderLeft: "2px solid rgba(255,255,255,0.9)",
                    borderTopLeftRadius: "0.5rem",
                  }}
                />
                <span
                  className="absolute top-4 right-4 w-9 h-9"
                  style={{
                    borderTop: "2px solid rgba(255,255,255,0.9)",
                    borderRight: "2px solid rgba(255,255,255,0.9)",
                    borderTopRightRadius: "0.5rem",
                  }}
                />
                <span
                  className="absolute bottom-4 left-4 w-9 h-9"
                  style={{
                    borderBottom: "2px solid rgba(255,255,255,0.9)",
                    borderLeft: "2px solid rgba(255,255,255,0.9)",
                    borderBottomLeftRadius: "0.5rem",
                  }}
                />
                <span
                  className="absolute bottom-4 right-4 w-9 h-9"
                  style={{
                    borderBottom: "2px solid rgba(255,255,255,0.9)",
                    borderRight: "2px solid rgba(255,255,255,0.9)",
                    borderBottomRightRadius: "0.5rem",
                  }}
                />

                {/* Scanning line */}
                <span
                  className="scan-line absolute left-2 right-2 h-[3px] rounded-full"
                  style={{
                    top: 0,
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 15%, rgba(255,240,232,1) 50%, rgba(255,255,255,0.15) 85%, transparent 100%)",
                    boxShadow:
                      "0 0 18px rgba(255,220,200,0.85), 0 0 44px rgba(231,180,168,0.55)",
                  }}
                />

                {/* Center status */}
                <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-2 text-white">
                  <span
                    className="scan-dot w-2.5 h-2.5 rounded-full"
                    style={{
                      background: "#fff",
                      boxShadow: "0 0 12px rgba(255,220,200,0.9)",
                    }}
                  />
                  <p
                    className="font-display text-[15px] tracking-wide"
                    style={{
                      textShadow: "0 1px 8px rgba(0,0,0,0.55)",
                    }}
                  >
                    Analyse en cours…
                  </p>
                </div>
              </div>
            )}
          </button>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="btn-ghost text-sm"
            >
              📸 Prendre
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="btn-ghost text-sm"
            >
              🖼️ Galerie
            </button>
          </div>

          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = "";
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
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="btn-ghost text-sm"
            >
              Reprendre
            </button>
            <button
              type="button"
              onClick={() => galleryRef.current?.click()}
              className="btn-ghost text-sm"
            >
              Autre photo
            </button>
          </div>
        )}
        <p className="text-center text-xs text-ink-muted">
          🔒 Photo utilisée uniquement pour l'analyse, jamais enregistrée
        </p>
      </div>
    </main>
  );
}
