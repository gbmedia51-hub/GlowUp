import Link from "next/link";
import { BottomNav } from "../BottomNav";
import { supabaseServer } from "@/lib/supabase/server";

export default async function RenewPage() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("expires_at")
    .eq("user_id", user!.id)
    .maybeSingle();

  const daysLeft = sub
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
        <Link href="/pro/today" className="text-sm text-ink-muted">
          ← Retour
        </Link>

        <div className="mt-8 card p-6 relative overflow-hidden">
          <div
            className="absolute -right-10 -top-10 w-40 h-40 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(180,92,77,0.35), transparent 70%)",
            }}
          />
          <span className="pill">Renouvellement</span>
          <h1 className="mt-4 font-display text-[28px] leading-tight text-ink">
            {daysLeft === null || daysLeft > 3
              ? "Votre GlowUp Pro est actif"
              : "Votre GlowUp Pro se termine bientôt"}
          </h1>
          <p className="mt-3 text-ink-muted leading-relaxed">
            {daysLeft === null
              ? "Aucun abonnement actif."
              : `Il reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""}. Renouvelez pour continuer sans interruption — un nouveau programme 30 jours sera généré à partir de votre progression.`}
          </p>

          <div className="mt-6 flex items-baseline gap-2">
            <span className="font-display text-5xl text-ink">1 999</span>
            <span className="text-ink-muted">FCFA</span>
          </div>
          <p className="text-xs text-ink-muted">
            Paiement unique · pas de reconduction
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link href="/paywall/checkout" className="btn-primary">
            Renouveler mon plan →
          </Link>
          <p className="text-center text-xs text-ink-muted">
            MTN MoMo · Orange Money · Carte bancaire
          </p>
        </div>
      </div>

      <BottomNav active="/pro/today" />
    </main>
  );
}
