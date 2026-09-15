import { OnboardingShell, Choice } from "../OnboardingShell";

const options = [
  { label: "Très bas", hint: "Astuces simples, presque zéro produit" },
  { label: "Bas", hint: "1 à 2 produits essentiels" },
  { label: "Moyen", hint: "Une routine complète mais raisonnable" },
  { label: "Flexible", hint: "Je veux ce qu'il y a de mieux" },
];

export default function Step5() {
  return (
    <OnboardingShell
      step={5}
      total={5}
      back="/onboarding/skin-type"
      next="/selfie"
      nextLabel="Continuer vers le selfie"
      title="Votre budget produits ?"
      subtitle="On adaptera vos recommandations. Vous pouvez le changer plus tard."
    >
      {options.map((o, i) => (
        <button
          key={o.label}
          className="choice"
          data-selected={i === 2 ? "true" : "false"}
          type="button"
        >
          <span>
            <span className="label block">{o.label}</span>
            <span className="block text-xs text-ink-muted mt-0.5">{o.hint}</span>
          </span>
          <span className="dot" />
        </button>
      ))}
    </OnboardingShell>
  );
}
