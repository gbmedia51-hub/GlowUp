import { OnboardingShell, Choice } from "./OnboardingShell";

const options = [
  "Une peau plus éclatante",
  "Une meilleure routine de soins",
  "Le maquillage",
  "Le soin du visage / grooming",
  "Les couleurs qui me mettent en valeur",
];
const preselected = new Set(["Une peau plus éclatante", "Le maquillage"]);

export default function OnboardingStep1() {
  return (
    <OnboardingShell
      step={1}
      total={5}
      back="/"
      next="/onboarding/routine"
      title="Que souhaitez-vous améliorer ?"
      subtitle="Choisissez tout ce qui vous correspond. Vous pourrez ajuster plus tard."
    >
      {options.map((label) => (
        <Choice key={label} label={label} selected={preselected.has(label)} multi />
      ))}
    </OnboardingShell>
  );
}
