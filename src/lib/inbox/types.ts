/**
 * Shared types for Lead Inbox + CRM (leads, conversations, messages, WA payloads).
 */

export type MessageDirection = "in" | "out";
export type MessageStatus = "sent" | "delivered" | "read" | "failed";

export interface Lead {
  id: string;
  created_at: string;
  phone: string;
  status: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  channel: string;
  phone_number_id: string;
  wa_id: string;
  last_message_at: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  direction: MessageDirection;
  wa_message_id: string | null;
  type: string;
  text: string | null;
  status: MessageStatus | null;
  timestamp: string;
}

// WhatsApp Cloud API webhook payload (simplified)
export interface WAWebhookEntry {
  id: string;
  changes?: Array<{
    value: WAWebhookValue;
    field: string;
  }>;
}

export interface WAWebhookValue {
  messaging_product?: string;
  metadata?: { phone_number_id: string; display_phone_number?: string };
  contacts?: Array<{ profile?: { name?: string }; wa_id: string }>;
  messages?: WAInboundMessage[];
  statuses?: WAStatus[];
}

export interface WAInboundMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  // other types (image, etc.) can be extended
}

export interface WAStatus {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  recipient_id?: string;
}
