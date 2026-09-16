// Minimal typed wrapper around the OpenAI REST API.
// Server-side only. Never import from a client component.

const API = "https://api.openai.com/v1";

function key() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY missing");
  return k;
}

export async function chatJson<T = unknown>({
  model,
  messages,
  maxTokens = 2048,
  temperature = 0.7,
}: {
  model: string;
  messages: any[];
  maxTokens?: number;
  temperature?: number;
}): Promise<T> {
  const r = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      max_tokens: maxTokens,
      temperature,
    }),
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);
  const data = await r.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content) as T;
}

export async function chatStream({
  model,
  messages,
  temperature = 0.7,
}: {
  model: string;
  messages: any[];
  temperature?: number;
}): Promise<ReadableStream<Uint8Array>> {
  const r = await fetch(`${API}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages, temperature, stream: true }),
  });
  if (!r.ok || !r.body) throw new Error(`OpenAI ${r.status}: ${await r.text()}`);

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const reader = r.body!.getReader();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const payload = line.slice(5).trim();
          if (payload === "[DONE]") {
            controller.close();
            return;
          }
          try {
            const chunk = JSON.parse(payload);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // ignore keepalives
          }
        }
      }
      controller.close();
    },
  });
}
