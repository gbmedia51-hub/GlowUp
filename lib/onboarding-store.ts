"use client";

// Tiny localStorage-backed onboarding + assessment state, so screens can be
// separate routes and still share state during the anonymous free flow.

export type Onboarding = {
  goals?: string[];
  routine?: string;
  skinGoal?: string;
  skinType?: string;
  budget?: string;
};

const KEY_ONB = "glowup.onboarding";
const KEY_ASSESSMENT = "glowup.assessment";
const KEY_IMAGE = "glowup.image";

export function readOnboarding(): Onboarding {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY_ONB) || "{}");
  } catch {
    return {};
  }
}
export function writeOnboarding(patch: Onboarding) {
  const merged = { ...readOnboarding(), ...patch };
  window.localStorage.setItem(KEY_ONB, JSON.stringify(merged));
}
export function clearOnboarding() {
  window.localStorage.removeItem(KEY_ONB);
  window.localStorage.removeItem(KEY_ASSESSMENT);
  window.localStorage.removeItem(KEY_IMAGE);
}

export function readAssessment(): any | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem(KEY_ASSESSMENT) || "null");
  } catch {
    return null;
  }
}
export function writeAssessment(a: any) {
  window.localStorage.setItem(KEY_ASSESSMENT, JSON.stringify(a));
}

export function readImage(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(KEY_IMAGE);
}
export function writeImage(dataUrl: string) {
  window.localStorage.setItem(KEY_IMAGE, dataUrl);
}
export function clearImage() {
  window.localStorage.removeItem(KEY_IMAGE);
}
