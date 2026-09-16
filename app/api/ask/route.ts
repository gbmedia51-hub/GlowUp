import { ASK_SYSTEM } from "@/lib/ai/prompts";
import { chatStream } from "@/lib/ai/openai";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  const { messages } = await req.json();
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("no_messages", { status: 400 });
  }

  const [{ data: profile }, { data: assessment }, { data: program }] = await Promise.all([
    supabase.from("profiles").select("onboarding").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("assessments")
      .select("summary,face_shape,color_profile,makeup,opportunities")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("programs")
      .select("days,start_date,end_date")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle(),
  ]);

  const context = {
    onboarding: profile?.onboarding ?? {},
    assessment: assessment ?? null,
    program_summary: program
      ? {
          start_date: program.start_date,
          end_date: program.end_date,
          today_index: dayIndex(program.start_date),
        }
      : null,
  };

  try {
    const stream = await chatStream({
      model: process.env.OPENAI_MODEL_CHAT || "gpt-4o-mini",
      temperature: 0.6,
      messages: [
        { role: "system", content: ASK_SYSTEM },
        { role: "system", content: `CONTEXTE UTILISATEUR:\n${JSON.stringify(context)}` },
        ...messages.slice(-10).map((m: any) => ({ role: m.role, content: m.content })),
      ],
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    console.error("[ask]", e?.message);
    return new Response("ai_error", { status: 502 });
  }
}

function dayIndex(startDate: string) {
  const start = new Date(startDate + "T00:00:00Z");
  const diff = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return Math.max(1, Math.min(30, diff + 1));
}
