import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function clean(v: string | undefined): string {
  return (v ?? "").replace(/\s+/g, "");
}

export function supabaseServer() {
  const cookieStore = cookies();
  return createServerClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(pairs) {
          try {
            pairs.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /* called from a server component during render — fine */
          }
        },
      },
    },
  );
}

// Server-side admin client that bypasses RLS. Only use inside route
// handlers that have their own authorization check (webhooks, cron).
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  return createClient(clean(process.env.NEXT_PUBLIC_SUPABASE_URL), clean(key), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// For /pro/* server components: require an active subscription.
// Anonymous users without a subscription are redirected to /pay.
export async function requireActiveSubscription() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const active =
    sub &&
    sub.status === "active" &&
    new Date(sub.expires_at).getTime() > Date.now();
  if (!active) redirect("/pay");
  return { supabase, user, subscription: sub! };
}

// For pre-paywall pages (landing, paywall, assessment): if this returning
// visitor already has an active subscription in their cookie session,
// send them straight to their daily plan.
export async function redirectIfActiveSub() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, expires_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const active =
    sub &&
    sub.status === "active" &&
    new Date(sub.expires_at).getTime() > Date.now();
  if (active) redirect("/pro/today");
}
