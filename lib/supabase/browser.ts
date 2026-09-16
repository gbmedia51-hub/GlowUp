"use client";
import { createBrowserClient } from "@supabase/ssr";

let cached: ReturnType<typeof createBrowserClient> | null = null;

function validate(name: string, v: string | undefined): string {
  if (!v) throw new Error(`${name} is missing`);
  const trimmed = v.trim();
  if (trimmed !== v) {
    throw new Error(
      `${name} has leading/trailing whitespace (length ${v.length} vs trimmed ${trimmed.length})`,
    );
  }
  for (let i = 0; i < v.length; i++) {
    const code = v.charCodeAt(i);
    if (code > 126 || code < 32) {
      throw new Error(
        `${name} has invalid char code ${code} at index ${i}`,
      );
    }
  }
  return v;
}

export function supabaseBrowser() {
  if (!cached) {
    const url = validate(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
    const key = validate(
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
