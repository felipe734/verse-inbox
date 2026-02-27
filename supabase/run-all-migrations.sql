-- Ejecutar todo este archivo en Supabase: SQL Editor → New query → Pegar → Run
-- verse-inbox: migraciones 001 + 002 + 003

-- ========== 001_inbox_crm ==========
create extension if not exists "pgcrypto";

create table if not exists public.raw_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'whatsapp',
  channel text not null default 'whatsapp',
  received_at timestamptz not null default now(),
  dedupe_key text not null,
  payload jsonb not null,
  constraint raw_events_dedupe_key_unique unique (dedupe_key)
);
create index if not exists raw_events_provider_received_at_idx on public.raw_events (provider, received_at desc);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  phone text not null,
  status text not null default 'active',
  constraint leads_phone_unique unique (phone)
);
create index if not exists leads_phone_idx on public.leads (phone);

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

-- ========== 002_teams_users_tags_notes ==========
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text,
  image text,
  created_at timestamptz not null default now(),
  constraint users_email_unique unique (email)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  created_at timestamptz not null default now(),
  constraint teams_slug_unique unique (slug)
);

create table if not exists public.team_members (
  user_id uuid not null references public.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  primary key (user_id, team_id)
);
create index if not exists team_members_team_id_idx on public.team_members (team_id);

create table if not exists public.conversation_assignments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  constraint conversation_assignments_conversation_unique unique (conversation_id)
);
create index if not exists conversation_assignments_user_id_idx on public.conversation_assignments (user_id);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  color text,
  created_at timestamptz not null default now(),
  constraint tags_slug_unique unique (slug)
);

create table if not exists public.conversation_tags (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (conversation_id, tag_id)
);
create index if not exists conversation_tags_conversation_id_idx on public.conversation_tags (conversation_id);

create table if not exists public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists internal_notes_conversation_created_idx on public.internal_notes (conversation_id, created_at);

insert into public.tags (name, slug, color) values
  ('New Lead', 'new-lead', '#22c55e'),
  ('Hot Lead', 'hot-lead', '#ef4444'),
  ('VIP Client', 'vip-client', '#8b5cf6')
on conflict (slug) do nothing;

insert into public.users (email, name) values ('team@example.com', 'Demo User')
on conflict (email) do nothing;
insert into public.teams (name, slug) values ('Sales', 'sales') on conflict (slug) do nothing;
insert into public.team_members (user_id, team_id)
select u.id, t.id from public.users u, public.teams t where u.email = 'team@example.com' and t.slug = 'sales'
on conflict do nothing;

-- ========== 003_users_password ==========
alter table public.users add column if not exists password_hash text;
