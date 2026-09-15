import { OnboardingShell, Choice } from "../OnboardingShell";

const options = [
  "Je n'ai pas de routine",
  "Routine de base",
  "J'utilise plusieurs produits",
  "Je ne sais pas trop ce que je fais",
];

export default function Step2() {
  return (
    <OnboardingShell
      step={2}
      total={5}
      back="/onboarding"
      next="/onboarding/skin-goal"
      title="Votre routine actuelle ?"
      subtitle="Aucune réponse n'est mauvaise — c'est juste pour bien vous conseiller."
    >
      {options.map((l, i) => (
        <Choice key={l} label={l} selected={i === 1} />
      ))}
    </OnboardingShell>
  );
}
