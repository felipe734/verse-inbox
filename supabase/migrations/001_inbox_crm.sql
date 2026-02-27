-- verse-inbox: Lead Inbox + CRM core (raw events, leads, conversations, messages)

create extension if not exists "pgcrypto";

-- Append-only raw webhook payloads; dedupe by dedupe_key (idempotent)
create table if not exists public.raw_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'whatsapp',
  channel text not null default 'whatsapp',
  received_at timestamptz not null default now(),
  dedupe_key text not null,
  payload jsonb not null,
  constraint raw_events_dedupe_key_unique unique (dedupe_key)
);

create index if not exists raw_events_provider_received_at_idx
  on public.raw_events (provider, received_at desc);

-- Leads by phone (or wa_id as fallback identity)
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  phone text not null,
  status text not null default 'active',
  constraint leads_phone_unique unique (phone)
);

create index if not exists leads_phone_idx on public.leads (phone);

-- One conversation per (channel, phone_number_id, wa_id)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  channel text not null,
  phone_number_id text not null,
  wa_id text not null,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  constraint conversations_channel_phone_wa_unique unique (channel, phone_number_id, wa_id)
);

create index if not exists conversations_lead_id_idx on public.conversations (lead_id);
create index if not exists conversations_last_message_at_idx on public.conversations (last_message_at desc nulls last);

-- Messages (inbound + outbound); status updated from webhook statuses
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  wa_message_id text,
  type text not null default 'text',
  text text,
  status text check (status is null or status in ('sent', 'delivered', 'read', 'failed')),
  timestamp timestamptz not null default now(),
  constraint messages_wa_message_id_unique unique (wa_message_id)
);

create index if not exists messages_conversation_timestamp_idx on public.messages (conversation_id, timestamp);
create index if not exists messages_wa_message_id_idx on public.messages (wa_message_id) where wa_message_id is not null;
