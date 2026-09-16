import { requireActiveSubscription } from "@/lib/supabase/server";

// Gates every /pro/* route: only reachable with an active subscription.
// Individual pages may still call requireActiveSubscription() to grab
// the supabase client and user — the extra call is trivial.
export default async function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireActiveSubscription();
  return <>{children}</>;
}
