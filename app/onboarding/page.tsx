"use client";
import { useEffect, useState } from "react";
import { OnboardingShell, Choice } from "./OnboardingShell";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding-store";

const options = [
  "Une peau plus éclatante",
  "Une meilleure routine de soins",
  "Le maquillage",
  "Le soin du visage / grooming",
  "Les couleurs qui me mettent en valeur",
];

export default function Step1() {
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => setSelected(readOnboarding().goals ?? []), []);
  const toggle = (o: string) =>
    setSelected((prev) =>
      prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o],
    );
  return (
    <OnboardingShell
      step={1}
      total={5}
      back="/"
      next="/onboarding/routine"
      title="Que souhaitez-vous améliorer ?"
      subtitle="Choisissez tout ce qui vous correspond. Vous pourrez ajuster plus tard."
      disabled={selected.length === 0}
      onNext={() => writeOnboarding({ goals: selected })}
    >
      {options.map((o) => (
        <Choice
          key={o}
          label={o}
          multi
          selected={selected.includes(o)}
          onClick={() => toggle(o)}
        />
      ))}
    </OnboardingShell>
  );
}
