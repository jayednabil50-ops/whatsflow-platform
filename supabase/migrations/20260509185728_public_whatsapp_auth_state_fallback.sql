create table if not exists public.whatsapp_session_credentials (
  session_id uuid primary key references public.whatsapp_sessions(id) on delete cascade,
  creds_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_session_keys (
  session_id uuid not null references public.whatsapp_sessions(id) on delete cascade,
  key_type text not null,
  key_id text not null,
  value_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, key_type, key_id)
);

alter table public.whatsapp_session_credentials enable row level security;
alter table public.whatsapp_session_keys enable row level security;

revoke all on public.whatsapp_session_credentials from anon, authenticated;
revoke all on public.whatsapp_session_keys from anon, authenticated;
grant select, insert, update, delete on public.whatsapp_session_credentials to service_role;
grant select, insert, update, delete on public.whatsapp_session_keys to service_role;

drop trigger if exists whatsapp_session_credentials_public_set_updated_at on public.whatsapp_session_credentials;
create trigger whatsapp_session_credentials_public_set_updated_at
before update on public.whatsapp_session_credentials
for each row execute function public.set_updated_at();

drop trigger if exists whatsapp_session_keys_public_set_updated_at on public.whatsapp_session_keys;
create trigger whatsapp_session_keys_public_set_updated_at
before update on public.whatsapp_session_keys
for each row execute function public.set_updated_at();

create index if not exists whatsapp_session_keys_session_idx
on public.whatsapp_session_keys (session_id);
