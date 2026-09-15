import Link from "next/link";

const items = [
  { href: "/pro/today", label: "Aujourd'hui", icon: "✦" },
  { href: "/pro/progress", label: "Progression", icon: "◐" },
  { href: "/pro/ask", label: "Ask GlowUp", icon: "✧" },
];

export function BottomNav({ active }: { active: string }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none"
      aria-label="Navigation principale"
    >
      <div className="w-full max-w-[440px] px-4 pb-4 pointer-events-auto">
        <div className="card px-2 py-2 flex justify-around">
          {items.map((it) => {
            const on = it.href === active;
            return (
              <Link
                key={it.href}
                href={it.href}
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl"
                style={{
                  color: on ? "#B45C4D" : "#6B5E58",
                  background: on ? "#FFF3EC" : "transparent",
                }}
              >
                <span className="text-lg leading-none">{it.icon}</span>
                <span className="text-[11px] font-medium">{it.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
