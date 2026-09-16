import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { onboarding, assessment } = await req.json();
  if (!assessment || typeof assessment.score !== "number") {
    return NextResponse.json({ error: "invalid_assessment" }, { status: 400 });
  }

  await supabase.from("profiles").upsert(
    { user_id: user.id, onboarding: onboarding ?? {} },
    { onConflict: "user_id" },
  );

  const { error } = await supabase.from("assessments").insert({
    user_id: user.id,
    summary: String(assessment.summary ?? ""),
    face_shape: assessment.face_shape ?? null,
    facial_features: assessment.facial_features ?? null,
    skin_observations: assessment.skin_observations ?? [],
    color_profile: assessment.color_profile ?? {},
    makeup: assessment.makeup ?? {},
    score: Math.max(0, Math.min(100, Math.round(assessment.score))),
    score_breakdown: assessment.score_breakdown ?? {},
    opportunities: assessment.opportunities ?? [],
  });
  if (error) {
    console.error("[save-assessment]", error.message);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
