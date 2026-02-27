import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedDbUser } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await getAuthenticatedDbUser();
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  let body: { body: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.body === "string" ? body.body.trim() : "";
  if (!text) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: note, error } = await supabase
    .from("internal_notes")
    .insert({ conversation_id: conversationId, author_id: actor.id, body: text })
    .select("id, body, created_at")
    .single();

  if (error || !note) {
    return NextResponse.json({ error: "Insert failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    note: { id: note.id, body: note.body, created_at: note.created_at },
  });
}
