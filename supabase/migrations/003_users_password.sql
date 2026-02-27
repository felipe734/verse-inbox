-- Optional: password for Credentials auth (team members)
alter table public.users add column if not exists password_hash text;
