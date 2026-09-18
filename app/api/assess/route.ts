import { NextResponse } from "next/server";
import { ASSESSMENT_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

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

  try {
    const result: any = await chatJson({
      model: process.env.OPENAI_MODEL_ASSESSMENT || "gpt-4o-mini",
      messages: [
        { role: "system", content: ASSESSMENT_SYSTEM },
        {
          role: "user",
          content: [
            { type: "text", text: JSON.stringify({ onboarding: onboarding ?? {} }) },
            { type: "image_url", image_url: { url: image, detail: "low" } },
          ],
        },
      ],
      maxTokens: 1500,
      temperature: 0.5,
    });

    if (result?.error === "no_face") {
      return NextResponse.json({ error: "no_face" }, { status: 200 });
    }

    // Persist profile + assessment for this anonymous user.
    await supabase
      .from("profiles")
      .upsert(
        { user_id: user.id, onboarding: onboarding ?? {} },
        { onConflict: "user_id" },
      );

    await supabase.from("assessments").insert({
      user_id: user.id,
      summary: String(result.summary ?? ""),
      face_shape: result.face_shape ?? null,
      facial_features: result.facial_features ?? null,
      skin_observations: result.skin_observations ?? [],
      color_profile: result.color_profile ?? {},
      makeup: result.makeup ?? {},
      score: Math.max(0, Math.min(100, Math.round(result.score ?? 0))),
      score_breakdown: result.score_breakdown ?? {},
      opportunities: result.opportunities ?? [],
      quick_wins: result.quick_wins ?? [],
    });

    return NextResponse.json(result);
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    console.error("[assess]", msg);
    return NextResponse.json(
      { error: "assessment_failed", detail: msg.slice(0, 300) },
      { status: 502 },
    );
  }
}
