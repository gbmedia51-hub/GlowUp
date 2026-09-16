"use client";
import { useEffect, useState } from "react";
import { OnboardingShell, Choice } from "../OnboardingShell";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding-store";

const options = [
  "Une peau plus éclatante",
  "Moins d'imperfections visibles",
  "Un teint plus uniforme",
  "Moins de brillance",
  "Moins de tiraillements",
  "Une peau visiblement plus saine",
];

export default function Step3() {
  const [value, setValue] = useState<string | undefined>();
  useEffect(() => setValue(readOnboarding().skinGoal), []);
  return (
    <OnboardingShell
      step={3}
      total={5}
      back="/onboarding/routine"
      next="/onboarding/skin-type"
      title="Votre objectif principal ?"
      subtitle="On priorisera cet objectif dans vos recommandations."
      disabled={!value}
      onNext={() => value && writeOnboarding({ skinGoal: value })}
    >
      {options.map((o) => (
        <Choice key={o} label={o} selected={value === o} onClick={() => setValue(o)} />
      ))}
    </OnboardingShell>
  );
}
