import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthenticatedDbUser } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await getAuthenticatedDbUser())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: conversationId } = await params;
  let body: { tagIds: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tagIds = Array.isArray(body.tagIds) ? body.tagIds.filter((id) => typeof id === "string") : [];

  const supabase = createSupabaseAdminClient();
  await supabase.from("conversation_tags").delete().eq("conversation_id", conversationId);
  if (tagIds.length > 0) {
    await supabase.from("conversation_tags").insert(
      tagIds.map((tag_id) => ({ conversation_id: conversationId, tag_id }))
    );
  }

  return NextResponse.json({ ok: true });
}
