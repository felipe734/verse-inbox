import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedDbUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAuthenticatedDbUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  let body: { userId: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userId = body.userId === null || body.userId === "" ? null : body.userId;

  const supabase = createSupabaseAdminClient();
  await supabase.from("conversation_assignments").upsert(
    { conversation_id: conversationId, user_id: userId, assigned_at: new Date().toISOString() },
    { onConflict: "conversation_id" }
  );

  return NextResponse.json({ ok: true });
}
