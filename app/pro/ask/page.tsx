"use client";
import { useEffect, useRef, useState } from "react";
import { BottomNav } from "../BottomNav";

type Msg = { role: "user" | "assistant"; content: string };

const suggestions = [
  "Que faire si j'ai sauté hier ?",
  "Quel maquillage avec une tenue beige ?",
  "Puis-je ajouter un autre produit ?",
  "Quelle couleur de rouge à lèvres ce soir ?",
];

function Bubble({ from, children }: { from: "me" | "ai"; children: React.ReactNode }) {
  const me = from === "me";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"}`}>
      <div
        className="max-w-[85%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed whitespace-pre-wrap"
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

export default function AskPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: "Bonjour ! Posez-moi une question sur votre routine, un look, une couleur…",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    if (!text.trim() || busy) return;
    const withUser: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(withUser);
    setInput("");
    setBusy(true);
    setMessages([...withUser, { role: "assistant", content: "" }]);

    try {
      const r = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: withUser }),
      });
      if (!r.ok || !r.body) throw new Error("bad");
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...withUser, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([
        ...withUser,
        { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg flex flex-col pb-28">
      <div className="gradient-bg px-6 pt-10 pb-6">
        <span className="pill">Ask GlowUp</span>
        <h1 className="mt-3 font-display text-[28px] text-ink">
          Votre assistant beauté
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Vos réponses sont adaptées à votre profil.
        </p>
      </div>

      <div className="px-6 pt-4 flex-1 space-y-3">
        {messages.map((m, i) => (
          <Bubble key={i} from={m.role === "user" ? "me" : "ai"}>
            {m.content || (busy && i === messages.length - 1 ? "…" : "")}
          </Bubble>
        ))}
        <div ref={endRef} />
      </div>

      <div className="px-6 pt-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={busy}
              className="whitespace-nowrap text-sm px-3 py-2 rounded-full border border-line bg-white text-ink"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mt-3 flex items-center gap-2 card px-3 py-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            className="flex-1 bg-transparent outline-none text-ink placeholder:text-ink-muted py-2"
            placeholder="Posez votre question…"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: "#B45C4D", opacity: busy || !input.trim() ? 0.5 : 1 }}
            aria-label="Envoyer"
          >
            ↑
          </button>
        </form>
      </div>

      <BottomNav active="/pro/ask" />
    </main>
  );
}
