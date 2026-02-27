import { createHash, createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const PROVIDER = "whatsapp";
const CHANNEL = "whatsapp";

function hashDedupe(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!secret || !signature) return true;
  const prefix = "sha256=";
  if (!signature.startsWith(prefix)) return false;
  const received = signature.slice(prefix.length);
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(received, "hex"), Buffer.from(expected, "hex"));
}

async function insertRawEvent(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  dedupeKey: string,
  payload: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase.from("raw_events").insert({
    provider: PROVIDER,
    channel: CHANNEL,
    dedupe_key: dedupeKey,
    payload,
  });

  if (!error) return true;
  if (error.code === "23505") return false;
  console.error("raw_events insert error:", error);
  return false;
}

export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get("hub.mode");
  const token = request.nextUrl.searchParams.get("hub.verify_token");
  const challenge = request.nextUrl.searchParams.get("hub.challenge");
  const verifyToken = process.env.WA_VERIFY_TOKEN;

  if (mode === "subscribe" && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.WA_APP_SECRET;
  if (appSecret && !verifySignature(rawBody, signature, appSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: {
    object?: string;
    entry?: Array<{
      id?: string;
      changes?: Array<{ value?: unknown }>;
    }>;
  };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !Array.isArray(body.entry)) {
    return new NextResponse(null, { status: 200 });
  }

  const supabase = createSupabaseAdminClient();
  const payload = body as Record<string, unknown>;

  for (let entryIndex = 0; entryIndex < body.entry.length; entryIndex += 1) {
    const entry = body.entry[entryIndex];
    const changes = entry?.changes;
    if (!Array.isArray(changes)) continue;

    for (let changeIndex = 0; changeIndex < changes.length; changeIndex += 1) {
      const change = changes[changeIndex];
      const value = change?.value as {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ wa_id?: string; profile?: { name?: string } }>;
        messages?: Array<{
          id?: string;
          from?: string;
          timestamp?: string;
          type?: string;
          text?: { body?: string };
        }>;
        statuses?: Array<{ id?: string; status?: string; timestamp?: string }>;
      } | undefined;

      if (!value) continue;

      const phoneNumberId = value.metadata?.phone_number_id;

      if (Array.isArray(value.messages)) {
        for (let messageIndex = 0; messageIndex < value.messages.length; messageIndex += 1) {
          const message = value.messages[messageIndex];
          const dedupeKey =
            message.id ??
            hashDedupe(`${rawBody}:message:${entryIndex}:${changeIndex}:${messageIndex}`);
          const inserted = await insertRawEvent(supabase, `wa_msg:${dedupeKey}`, payload);
          if (!inserted) continue;

          if (!phoneNumberId) {
            console.warn("Webhook message missing metadata.phone_number_id");
            continue;
          }

          const waId = message.from ?? value.contacts?.[0]?.wa_id;
          if (!waId) {
            console.warn("Webhook message missing from/contacts[0].wa_id");
            continue;
          }

          const { data: leadData } = await supabase
            .from("leads")
            .upsert({ phone: waId, status: "active" }, { onConflict: "phone" })
            .select("id")
            .single();
          const leadId = leadData?.id;
          if (!leadId) continue;

          const ts = message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString();

          const { data: convData } = await supabase
            .from("conversations")
            .upsert(
              {
                lead_id: leadId,
                channel: CHANNEL,
                phone_number_id: phoneNumberId,
                wa_id: waId,
                last_message_at: ts,
              },
              { onConflict: "channel,phone_number_id,wa_id" }
            )
            .select("id")
            .single();
          const conversationId = convData?.id;
          if (!conversationId) continue;

          const { error: messageInsertError } = await supabase.from("messages").insert({
            conversation_id: conversationId,
            direction: "in",
            wa_message_id: message.id ?? null,
            type: message.type ?? "text",
            text: message.text?.body ?? null,
            timestamp: ts,
          });
          if (messageInsertError && messageInsertError.code !== "23505") {
            console.error("messages insert error:", messageInsertError);
          }
        }
      }

      if (Array.isArray(value.statuses)) {
        for (let statusIndex = 0; statusIndex < value.statuses.length; statusIndex += 1) {
          const st = value.statuses[statusIndex];
          const dedupeKey = st.id
            ? `${st.id}:${st.status ?? ""}:${st.timestamp ?? ""}`
            : hashDedupe(`${rawBody}:status:${entryIndex}:${changeIndex}:${statusIndex}`);
          const inserted = await insertRawEvent(supabase, `wa_status:${dedupeKey}`, payload);
          if (!inserted) continue;

          if (!st.id || !st.status) continue;
          await supabase.from("messages").update({ status: st.status }).eq("wa_message_id", st.id);
        }
      }
    }
  }

  return new NextResponse(null, { status: 200 });
}
