import { NextResponse } from "next/server";
import { PROGRAM_SYSTEM } from "@/lib/ai/prompts";
import { chatJson } from "@/lib/ai/openai";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST() {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [{ data: profile }, { data: assessment }] = await Promise.all([
    supabase.from("profiles").select("onboarding").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("assessments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!assessment) {
    return NextResponse.json({ error: "no_assessment" }, { status: 400 });
  }

  try {
    const result = await chatJson<{ days: any[] }>({
      model: process.env.OPENAI_MODEL_ASSESSMENT || "gpt-4o",
      messages: [
        { role: "system", content: PROGRAM_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            onboarding: profile?.onboarding ?? {},
            assessment,
          }),
        },
      ],
      maxTokens: 4096,
      temperature: 0.6,
    });

    if (!Array.isArray(result?.days) || result.days.length < 20) {
      return NextResponse.json({ error: "invalid_program" }, { status: 502 });
    }

    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    // Deactivate previous programs, insert new one.
    await supabase.from("programs").update({ active: false }).eq("user_id", user.id);
    const { data: inserted, error } = await supabase
      .from("programs")
      .insert({
        user_id: user.id,
        days: result.days.slice(0, 30),
        start_date: iso(today),
        end_date: iso(end),
        active: true,
      })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ program: inserted });
  } catch (e: any) {
    console.error("[generate-program]", e?.message);
    return NextResponse.json({ error: "generation_failed" }, { status: 502 });
  }
}
