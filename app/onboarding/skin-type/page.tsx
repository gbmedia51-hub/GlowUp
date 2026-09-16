"use client";
import { useEffect, useState } from "react";
import { OnboardingShell, Choice } from "../OnboardingShell";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding-store";

const options = ["Grasse", "Sèche", "Mixte", "Normale", "Sensible", "Je ne sais pas"];

export default function Step4() {
  const [value, setValue] = useState<string | undefined>();
  useEffect(() => setValue(readOnboarding().skinType), []);
  return (
    <OnboardingShell
      step={4}
      total={5}
      back="/onboarding/skin-goal"
      next="/onboarding/budget"
      title="Votre type de peau ?"
      subtitle='Aucune idée ? "Je ne sais pas" fonctionne très bien.'
      disabled={!value}
      onNext={() => value && writeOnboarding({ skinType: value })}
    >
      {options.map((o) => (
        <Choice key={o} label={o} selected={value === o} onClick={() => setValue(o)} />
      ))}
    </OnboardingShell>
  );
}
