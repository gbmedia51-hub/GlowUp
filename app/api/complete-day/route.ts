import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    program_id,
    day,
    morning_done = false,
    makeup_done = false,
    evening_done = false,
  } = body;
  if (!program_id || typeof day !== "number") {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const allDone = morning_done && makeup_done && evening_done;
  const { error } = await supabase.from("daily_progress").upsert(
    {
      program_id,
      day,
      user_id: user.id,
      morning_done,
      makeup_done,
      evening_done,
      completed_at: allDone ? new Date().toISOString() : null,
    },
    { onConflict: "program_id,day" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
