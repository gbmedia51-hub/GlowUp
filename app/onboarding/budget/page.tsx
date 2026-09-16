"use client";
import { useEffect, useState } from "react";
import { OnboardingShell, Choice } from "../OnboardingShell";
import { readOnboarding, writeOnboarding } from "@/lib/onboarding-store";

const options = [
  { label: "Très bas", hint: "Astuces simples, presque zéro produit" },
  { label: "Bas", hint: "1 à 2 produits essentiels" },
  { label: "Moyen", hint: "Une routine complète mais raisonnable" },
  { label: "Flexible", hint: "Je veux ce qu'il y a de mieux" },
];

export default function Step5() {
  const [value, setValue] = useState<string | undefined>();
  useEffect(() => setValue(readOnboarding().budget), []);
  return (
    <OnboardingShell
      step={5}
      total={5}
      back="/onboarding/skin-type"
      next="/selfie"
      nextLabel="Continuer vers le selfie"
      title="Votre budget produits ?"
      subtitle="On adaptera vos recommandations. Vous pouvez le changer plus tard."
      disabled={!value}
      onNext={() => value && writeOnboarding({ budget: value })}
    >
      {options.map((o) => (
        <Choice
          key={o.label}
          label={o.label}
          hint={o.hint}
          selected={value === o.label}
          onClick={() => setValue(o.label)}
        />
      ))}
    </OnboardingShell>
  );
}
