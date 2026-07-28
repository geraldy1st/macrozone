-- A007 helper: ensure every auth user has a profiles row (safe to re-run)

insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'User'
  )
from auth.users u
on conflict (id) do nothing;
