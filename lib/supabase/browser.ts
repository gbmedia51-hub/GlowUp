"use client";
import { createBrowserClient } from "@supabase/ssr";

let cached: ReturnType<typeof createBrowserClient> | null = null;

// Silently strip any whitespace (spaces, newlines, tabs) — none of which
// are ever legal in a Supabase URL or anon key. Fixes mobile-paste
// corruption where the value gets a stray \n in the middle.
function clean(name: string, v: string | undefined): string {
  if (!v) throw new Error(`${name} is missing`);
  const stripped = v.replace(/\s+/g, "");
  if (!stripped) throw new Error(`${name} empty after whitespace strip`);
  for (let i = 0; i < stripped.length; i++) {
    const code = stripped.charCodeAt(i);
    if (code > 126 || code < 32) {
      throw new Error(`${name} has invalid char code ${code} at index ${i}`);
    }
  }
  return stripped;
}

export function supabaseBrowser() {
  if (!cached) {
    const url = clean(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
    const key = clean(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    cached = createBrowserClient(url, key);
  }
  return cached;
}

// Ensures the visitor has some Supabase session — creates an anonymous
// one if none exists. Returns the user, or throws.
export async function ensureSession() {
  const supabase = supabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw new Error(error?.message || "anonymous_signin_failed");
  }
  return data.user;
}
