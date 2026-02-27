/**
 * WhatsApp Cloud API (Graph API) client for sending messages.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const BASE = "https://graph.facebook.com/v19.0";

export interface SendTextResult {
  messaging_product: string;
  contacts?: Array<{ wa_id: string; input: string }>;
  messages?: Array<{ id: string }>;
  error?: { message: string; code: number; error_subcode?: number };
}

export async function sendWhatsAppText(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string
): Promise<SendTextResult> {
  // to: wa_id without + (e.g. 573001234567)
  const toClean = to.replace(/\D/g, "");
  const url = `${BASE}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toClean,
      type: "text",
      text: { body: text },
    }),
  });

  const data = (await res.json()) as SendTextResult;
  if (!res.ok) {
    throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  }
  return data;
}
