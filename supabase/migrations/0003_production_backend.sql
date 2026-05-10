create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to service_role;

create table if not exists private.whatsapp_session_credentials (
  session_id uuid primary key references public.whatsapp_sessions(id) on delete cascade,
  creds_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.whatsapp_session_keys (
  session_id uuid not null references public.whatsapp_sessions(id) on delete cascade,
  key_type text not null,
  key_id text not null,
  value_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, key_type, key_id)
);

grant select, insert, update, delete on all tables in schema private to service_role;
alter default privileges in schema private
  revoke all on tables from public, anon, authenticated;
alter default privileges in schema private
  grant select, insert, update, delete on tables to service_role;

drop trigger if exists whatsapp_session_credentials_set_updated_at on private.whatsapp_session_credentials;
create trigger whatsapp_session_credentials_set_updated_at
before update on private.whatsapp_session_credentials
for each row execute function public.set_updated_at();

drop trigger if exists whatsapp_session_keys_set_updated_at on private.whatsapp_session_keys;
create trigger whatsapp_session_keys_set_updated_at
before update on private.whatsapp_session_keys
for each row execute function public.set_updated_at();

alter table private.whatsapp_session_credentials enable row level security;
alter table private.whatsapp_session_keys enable row level security;

alter table public.whatsapp_sessions
alter column phone_number set not null;

create unique index if not exists messages_session_direction_external_message_key
on public.messages (session_id, direction, external_message_id)
where external_message_id is not null;

create index if not exists messages_user_session_created_at_idx
on public.messages (user_id, session_id, created_at desc);

create index if not exists webhook_deliveries_session_created_at_idx
on public.webhook_deliveries (session_id, created_at desc);
