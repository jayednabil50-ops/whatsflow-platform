create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

drop policy if exists "profiles owner access" on public.profiles;
create policy "profiles owner access" on public.profiles
for all using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "sessions owner access" on public.whatsapp_sessions;
create policy "sessions owner access" on public.whatsapp_sessions
for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "pat owner access" on public.personal_access_tokens;
create policy "pat owner access" on public.personal_access_tokens
for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "messages owner access" on public.messages;
create policy "messages owner access" on public.messages
for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "webhook deliveries via session owner access" on public.webhook_deliveries;
create policy "webhook deliveries via session owner access" on public.webhook_deliveries
for all
using (
  exists (
    select 1
    from public.whatsapp_sessions ws
    where ws.id = webhook_deliveries.session_id
      and ws.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.whatsapp_sessions ws
    where ws.id = webhook_deliveries.session_id
      and ws.user_id = (select auth.uid())
  )
);

drop policy if exists "subscriptions owner access" on public.subscriptions;
create policy "subscriptions owner access" on public.subscriptions
for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "usage owner access" on public.usage_daily;
create policy "usage owner access" on public.usage_daily
for all using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
