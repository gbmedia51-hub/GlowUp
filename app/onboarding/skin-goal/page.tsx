import { OnboardingShell, Choice } from "../OnboardingShell";

const options = [
  "Une peau plus éclatante",
  "Moins d'imperfections visibles",
  "Un teint plus uniforme",
  "Moins de brillance",
  "Moins de tiraillements",
  "Une peau visiblement plus saine",
];

export default function Step3() {
  return (
    <OnboardingShell
      step={3}
      total={5}
      back="/onboarding/routine"
      next="/onboarding/skin-type"
      title="Votre objectif principal ?"
      subtitle="On priorisera cet objectif dans vos recommandations."
    >
      {options.map((l, i) => (
        <Choice key={l} label={l} selected={i === 0} />
      ))}
    </OnboardingShell>
  );
}
