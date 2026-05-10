create or replace function public.sync_profile_from_auth_user_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = new.email,
    full_name = coalesce(new.raw_user_meta_data->>'full_name', full_name),
    avatar_url = coalesce(new.raw_user_meta_data->>'avatar_url', avatar_url)
  where id = new.id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_updated_sync_profile on auth.users;
create trigger on_auth_user_updated_sync_profile
after update on auth.users
for each row
when (
  old.email is distinct from new.email
  or old.raw_user_meta_data is distinct from new.raw_user_meta_data
)
execute function public.sync_profile_from_auth_user_update();

create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    new.id := old.id;
    new.email := old.email;
    new.plan := old.plan;
    new.trial_ends_at := old.trial_ends_at;
    new.created_at := old.created_at;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_system_fields on public.profiles;
create trigger profiles_protect_system_fields
before update on public.profiles
for each row execute function public.protect_profile_system_fields();

drop policy if exists "profiles owner access" on public.profiles;
create policy "profiles owner read" on public.profiles
for select using (auth.uid() = id);
create policy "profiles owner update" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "sessions owner access" on public.whatsapp_sessions;
create policy "sessions owner read" on public.whatsapp_sessions
for select using (auth.uid() = user_id);

drop policy if exists "pat owner access" on public.personal_access_tokens;
create policy "pat owner read" on public.personal_access_tokens
for select using (auth.uid() = user_id);

drop policy if exists "messages owner access" on public.messages;
create policy "messages owner read" on public.messages
for select using (auth.uid() = user_id);

drop policy if exists "webhook deliveries via session owner access" on public.webhook_deliveries;
create policy "webhook deliveries owner read" on public.webhook_deliveries
for select
using (
  exists (
    select 1
    from public.whatsapp_sessions ws
    where ws.id = webhook_deliveries.session_id
      and ws.user_id = auth.uid()
  )
);

drop policy if exists "subscriptions owner access" on public.subscriptions;
create policy "subscriptions owner read" on public.subscriptions
for select using (auth.uid() = user_id);

drop policy if exists "usage owner access" on public.usage_daily;
create policy "usage owner read" on public.usage_daily
for select using (auth.uid() = user_id);
