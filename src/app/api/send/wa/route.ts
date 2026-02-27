import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppText } from "@/lib/inbox/wa-client";
import { getAuthenticatedDbUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { conversationId?: string; to?: string; text?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json({ ok: false, error: "text is required" }, { status: 400 });
  }

  if (!(await getAuthenticatedDbUser())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;
  const accessToken = process.env.WA_ACCESS_TOKEN;
  if (!phoneNumberId || !accessToken) {
    return NextResponse.json({ ok: false, error: "WhatsApp not configured" }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();
  let to: string;
  let conversationId: string | null = null;

  if (body.conversationId) {
    const { data: row, error } = await supabase
      .from("conversations")
      .select("id, wa_id")
      .eq("id", body.conversationId)
      .single();
    if (error || !row) {
      return NextResponse.json({ ok: false, error: "Conversation not found" }, { status: 404 });
    }
    to = row.wa_id;
    conversationId = row.id;
  } else if (body.to) {
    to = String(body.to).replace(/\D/g, "");
    if (!to) {
      return NextResponse.json({ ok: false, error: "to or conversationId required" }, { status: 400 });
    }
    const { data: row } = await supabase
      .from("conversations")
      .select("id")
      .eq("wa_id", to)
      .eq("channel", "whatsapp")
      .limit(1)
      .maybeSingle();
    conversationId = row?.id ?? null;
  } else {
    return NextResponse.json({ ok: false, error: "conversationId or to required" }, { status: 400 });
  }

  try {
    const result = await sendWhatsAppText(phoneNumberId, accessToken, to, text);
    const waMessageId = result.messages?.[0]?.id ?? null;

    if (conversationId && waMessageId) {
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        direction: "out",
        wa_message_id: waMessageId,
        type: "text",
        text,
        status: "sent",
      });
      await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversationId);
    }

    let messageId: string | null = null;
    if (conversationId && waMessageId) {
      const { data: msg } = await supabase.from("messages").select("id").eq("wa_message_id", waMessageId).maybeSingle();
      messageId = msg?.id ?? null;
    }

    return NextResponse.json({
      ok: true,
      wa_message_id: waMessageId,
      messageId,
      conversationId: conversationId ?? undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    console.error("send/wa error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
