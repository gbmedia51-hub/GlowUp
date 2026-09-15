import { BottomNav } from "../BottomNav";

function Bubble({ from, children }: { from: "me" | "ai"; children: React.ReactNode }) {
  const me = from === "me";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed"
        style={{
          background: me ? "#B45C4D" : "#fff",
          color: me ? "#fff" : "#2A211E",
          border: me ? "none" : "1px solid #EADFD4",
          borderBottomRightRadius: me ? 6 : undefined,
          borderBottomLeftRadius: me ? undefined : 6,
        }}
      >
        {children}
      </div>
    </div>
  );
}

const suggestions = [
  "Que faire si j'ai sauté hier ?",
  "Quel maquillage avec une tenue beige ?",
  "Puis-je ajouter un autre produit ?",
  "Quelle couleur de rouge à lèvres ce soir ?",
];

export default function AskPage() {
  return (
    <main className="min-h-screen bg-bg flex flex-col pb-28">
      <div className="gradient-bg px-6 pt-10 pb-6">
        <span className="pill">Ask GlowUp</span>
        <h1 className="mt-3 font-display text-[28px] text-ink">
          Votre assistant beauté
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Posez toute question sur votre routine, votre maquillage ou vos
          couleurs. GlowUp connaît déjà votre profil.
        </p>
      </div>

      <div className="px-6 pt-4 flex-1 space-y-3">
        <Bubble from="ai">
          Bonjour Aïcha ! Comment puis-je vous aider aujourd'hui ?
        </Bubble>
        <Bubble from="me">
          Je porte une robe verte olive ce soir. Quelle couleur de rouge à
          lèvres est la plus flatteuse pour moi ?
        </Bubble>
        <Bubble from="ai">
          Avec votre profil chaud (automne doux) et une robe olive, essayez un{" "}
          <b>terracotta mat</b> ou un <b>rose brique</b>. Évitez les fuchsias
          qui trancheraient. Ajoutez une touche de blush pêche et un mascara
          brun chocolat plutôt que noir pour rester dans votre gamme chaude.
        </Bubble>
        <Bubble from="me">Et si je n'ai pas de terracotta ?</Bubble>
        <Bubble from="ai">
          Prenez votre baume rose habituel et posez par-dessus un point de
          crayon à lèvres brun-cognac au centre — puis étalez. Effet terracotta
          instantané, très proche de votre palette recommandée.
        </Bubble>
      </div>

      <div className="px-6 pt-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {suggestions.map((s) => (
            <button
              key={s}
              className="whitespace-nowrap text-sm px-3 py-2 rounded-full border border-line bg-white text-ink"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2 card px-3 py-2">
          <input
            className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-muted py-2"
            placeholder="Posez votre question…"
          />
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: "#B45C4D" }}
            aria-label="Envoyer"
          >
            ↑
          </button>
        </div>
      </div>

      <BottomNav active="/pro/ask" />
    </main>
  );
}
