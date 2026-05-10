alter table public.whatsapp_sessions
add column if not exists country_code text,
add column if not exists connected_phone text,
add column if not exists connected_name text,
add column if not exists device text,
add column if not exists error text;

create index if not exists webhook_deliveries_session_status_idx
on public.webhook_deliveries (session_id, status, created_at desc);
