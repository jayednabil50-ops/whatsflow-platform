create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  plan text not null default 'trial',
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone_number text,
  status text not null default 'disconnected',
  qr_code text,
  pairing_code text,
  last_seen_at timestamptz,
  proxy_url text,
  behavior_profile jsonb not null default '{"preset":"balanced"}'::jsonb,
  webhook_url text,
  webhook_secret text,
  webhook_events text[] not null default array['message.received','message.sent','session.status'],
  api_key_hash text,
  api_key_prefix text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.personal_access_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  token_hash text,
  token_prefix text,
  scopes text[] not null default array['*'],
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.whatsapp_sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  direction text not null check (direction in ('inbound','outbound')),
  remote_jid text not null,
  message_type text,
  body text,
  media_url text,
  media_mime text,
  status text not null default 'pending',
  error_code text,
  error_message text,
  external_message_id text,
  created_at timestamptz not null default now()
);
create index if not exists messages_session_id_created_at_idx on public.messages (session_id, created_at desc);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.whatsapp_sessions(id) on delete cascade,
  event_type text,
  payload jsonb,
  status text,
  http_status int,
  attempts int not null default 0,
  next_retry_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text,
  status text,
  current_period_end timestamptz,
  paddle_subscription_id text,
  paddle_customer_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.usage_daily (
  id bigserial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.whatsapp_sessions(id) on delete cascade,
  day date not null,
  messages_sent int not null default 0,
  messages_received int not null default 0,
  webhook_deliveries int not null default 0,
  unique (user_id, session_id, day)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists whatsapp_sessions_set_updated_at on public.whatsapp_sessions;
create trigger whatsapp_sessions_set_updated_at
before update on public.whatsapp_sessions
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.whatsapp_sessions enable row level security;
alter table public.personal_access_tokens enable row level security;
alter table public.messages enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.subscriptions enable row level security;
alter table public.usage_daily enable row level security;

create policy "profiles owner access" on public.profiles
for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "sessions owner access" on public.whatsapp_sessions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "pat owner access" on public.personal_access_tokens
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "messages owner access" on public.messages
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "webhook deliveries via session owner access" on public.webhook_deliveries
for all
using (
  exists (
    select 1
    from public.whatsapp_sessions ws
    where ws.id = webhook_deliveries.session_id
      and ws.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.whatsapp_sessions ws
    where ws.id = webhook_deliveries.session_id
      and ws.user_id = auth.uid()
  )
);

create policy "subscriptions owner access" on public.subscriptions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "usage owner access" on public.usage_daily
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
