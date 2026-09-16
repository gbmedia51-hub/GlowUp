import { NextResponse } from "next/server";
import { ASSESSMENT_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { onboarding, image } = body ?? {};
  if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
    return NextResponse.json({ error: "image_required" }, { status: 400 });
  }
  if (image.length > 6_000_000) {
    return NextResponse.json({ error: "image_too_large" }, { status: 413 });
  }

  const userPayload = {
    onboarding: onboarding ?? {},
    instruction:
      "Analyse la photo ci-jointe et renvoie l'évaluation au format JSON défini par le système.",
  };

  try {
    const result = await chatJson({
      model: process.env.OPENAI_MODEL_ASSESSMENT || "gpt-4o",
      messages: [
        { role: "system", content: ASSESSMENT_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: JSON.stringify(userPayload) },
            { type: "image_url", image_url: { url: image, detail: "low" } },
          ],
        },
      ],
      maxTokens: 1500,
      temperature: 0.5,
    });
    return NextResponse.json(result);
  } catch (e: any) {
    console.error("[assess]", e?.message);
    return NextResponse.json({ error: "assessment_failed" }, { status: 502 });
  }
}
