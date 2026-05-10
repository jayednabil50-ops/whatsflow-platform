alter table public.profiles
add column if not exists updated_at timestamptz not null default now();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.whatsapp_sessions
alter column webhook_secret set default encode(gen_random_bytes(24), 'hex');

update public.whatsapp_sessions
set webhook_secret = encode(gen_random_bytes(24), 'hex')
where webhook_secret is null;

create unique index if not exists whatsapp_sessions_api_key_hash_idx
on public.whatsapp_sessions (api_key_hash)
where api_key_hash is not null;

create index if not exists usage_daily_user_day_idx
on public.usage_daily (user_id, day desc);

create or replace function public.bump_usage_daily(
  target_user_id uuid,
  target_session_id uuid,
  target_day date,
  sent_delta integer default 0,
  received_delta integer default 0,
  webhook_delta integer default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usage_daily (
    user_id,
    session_id,
    day,
    messages_sent,
    messages_received,
    webhook_deliveries
  )
  values (
    target_user_id,
    target_session_id,
    target_day,
    greatest(sent_delta, 0),
    greatest(received_delta, 0),
    greatest(webhook_delta, 0)
  )
  on conflict (user_id, session_id, day)
  do update set
    messages_sent = public.usage_daily.messages_sent + greatest(sent_delta, 0),
    messages_received = public.usage_daily.messages_received + greatest(received_delta, 0),
    webhook_deliveries = public.usage_daily.webhook_deliveries + greatest(webhook_delta, 0);
end;
$$;

revoke execute on function public.bump_usage_daily(uuid, uuid, date, integer, integer, integer) from public;
revoke execute on function public.bump_usage_daily(uuid, uuid, date, integer, integer, integer) from anon;
revoke execute on function public.bump_usage_daily(uuid, uuid, date, integer, integer, integer) from authenticated;
grant execute on function public.bump_usage_daily(uuid, uuid, date, integer, integer, integer) to service_role;
