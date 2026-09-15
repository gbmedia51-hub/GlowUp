import { OnboardingShell, Choice } from "../OnboardingShell";

const options = ["Grasse", "Sèche", "Mixte", "Normale", "Sensible", "Je ne sais pas"];

export default function Step4() {
  return (
    <OnboardingShell
      step={4}
      total={5}
      back="/onboarding/skin-goal"
      next="/onboarding/budget"
      title="Votre type de peau ?"
      subtitle='Aucune idée ? "Je ne sais pas" fonctionne très bien.'
    >
      {options.map((l, i) => (
        <Choice key={l} label={l} selected={i === 2} />
      ))}
    </OnboardingShell>
  );
}
