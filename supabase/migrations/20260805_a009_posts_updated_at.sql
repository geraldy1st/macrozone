-- =============================================================================
-- A009-2 — posts.updated_at for "edited" label + edit trigger
-- Apply in Supabase Dashboard → SQL Editor after A006 community feed.
-- =============================================================================

alter table public.posts
  add column if not exists updated_at timestamptz;

-- Existing rows: treat as never edited (updated_at = created_at)
update public.posts
set updated_at = created_at
where updated_at is null;

alter table public.posts
  alter column updated_at set default now();

alter table public.posts
  alter column updated_at set not null;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Done.
-- =============================================================================
