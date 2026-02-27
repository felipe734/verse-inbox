-- verse-inbox: Teams, users, assignments, tags, internal notes

-- Team members (for "Mine" and Teams filter)
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

-- One active assignment per conversation (reassign = update user_id)
create table if not exists public.conversation_assignments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  constraint conversation_assignments_conversation_unique unique (conversation_id)
);

create index if not exists conversation_assignments_user_id_idx on public.conversation_assignments (user_id);

-- Tags (internal labels: New Lead, Hot Lead, etc.)
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

-- Internal notes (team-only; shown in timeline, not sent to WA)
create table if not exists public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists internal_notes_conversation_created_idx on public.internal_notes (conversation_id, created_at);

-- Seed default tags
insert into public.tags (name, slug, color) values
  ('New Lead', 'new-lead', '#22c55e'),
  ('Hot Lead', 'hot-lead', '#ef4444'),
  ('VIP Client', 'vip-client', '#8b5cf6')
on conflict (slug) do nothing;

-- Seed one team and one user for demo (password: use NEXTAUTH_DEMO_PASSWORD env)
insert into public.users (email, name) values ('team@example.com', 'Demo User')
on conflict (email) do nothing;
insert into public.teams (name, slug) values ('Sales', 'sales') on conflict (slug) do nothing;
insert into public.team_members (user_id, team_id)
select u.id, t.id from public.users u, public.teams t where u.email = 'team@example.com' and t.slug = 'sales'
on conflict do nothing;
