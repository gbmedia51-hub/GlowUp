"use client";
import { useEffect, useState } from "react";
import { OnboardingShell, Choice } from "../OnboardingShell";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding-store";

const options = [
  "Je n'ai pas de routine",
  "Routine de base",
  "J'utilise plusieurs produits",
  "Je ne sais pas trop ce que je fais",
];

export default function Step2() {
  const [value, setValue] = useState<string | undefined>();
  useEffect(() => setValue(readOnboarding().routine), []);
  return (
    <OnboardingShell
      step={2}
      total={5}
      back="/onboarding"
      next="/onboarding/skin-goal"
      title="Votre routine actuelle ?"
      subtitle="Aucune réponse n'est mauvaise — c'est juste pour bien vous conseiller."
      disabled={!value}
      onNext={() => value && writeOnboarding({ routine: value })}
    >
      {options.map((o) => (
        <Choice key={o} label={o} selected={value === o} onClick={() => setValue(o)} />
      ))}
    </OnboardingShell>
  );
}
