create index if not exists subscriptions_user_period_idx
on public.subscriptions (user_id, current_period_end desc, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, plan, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'trial',
    now() + interval '2 days'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;

  return new;
end;
$$;

update public.profiles
set trial_ends_at = greatest(
  coalesce(trial_ends_at, created_at + interval '2 days'),
  created_at + interval '2 days'
)
where plan = 'trial';
