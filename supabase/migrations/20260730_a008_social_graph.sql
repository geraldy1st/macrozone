-- =============================================================================
-- A008-1 — Social graph: follows, blocks, last_seen, profile counters
-- Apply in Supabase Dashboard → SQL Editor (or via supabase CLI).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles: counters + presence
-- -----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists followers_count integer not null default 0
    check (followers_count >= 0);

alter table public.profiles
  add column if not exists following_count integer not null default 0
    check (following_count >= 0);

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- -----------------------------------------------------------------------------
-- 2. Follows (unidirectional subscriptions)
-- -----------------------------------------------------------------------------
create table if not exists public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create index if not exists follows_following_idx
  on public.follows (following_id, created_at desc);

create index if not exists follows_follower_idx
  on public.follows (follower_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 3. Blocks
-- -----------------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx
  on public.blocks (blocked_id);

-- -----------------------------------------------------------------------------
-- 4. Follow counter triggers
-- -----------------------------------------------------------------------------
create or replace function public.bump_follow_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles
    set following_count = following_count + 1
    where id = new.follower_id;

    update public.profiles
    set followers_count = followers_count + 1
    where id = new.following_id;

    return new;
  elsif tg_op = 'DELETE' then
    update public.profiles
    set following_count = greatest(following_count - 1, 0)
    where id = old.follower_id;

    update public.profiles
    set followers_count = greatest(followers_count - 1, 0)
    where id = old.following_id;

    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_count_insert on public.follows;
create trigger follows_count_insert
  after insert on public.follows
  for each row execute function public.bump_follow_counts();

drop trigger if exists follows_count_delete on public.follows;
create trigger follows_count_delete
  after delete on public.follows
  for each row execute function public.bump_follow_counts();

-- When blocking: remove any follow in either direction
create or replace function public.cleanup_follows_on_block()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where (follower_id = new.blocker_id and following_id = new.blocked_id)
     or (follower_id = new.blocked_id and following_id = new.blocker_id);
  return new;
end;
$$;

drop trigger if exists blocks_cleanup_follows on public.blocks;
create trigger blocks_cleanup_follows
  after insert on public.blocks
  for each row execute function public.cleanup_follows_on_block();

-- -----------------------------------------------------------------------------
-- 5. RLS
-- -----------------------------------------------------------------------------
alter table public.follows enable row level security;
alter table public.blocks enable row level security;

-- Follows: public read (for counts / lists); write only as self
drop policy if exists "follows_select_all" on public.follows;
create policy "follows_select_all"
  on public.follows for select
  using (true);

drop policy if exists "follows_insert_own" on public.follows;
create policy "follows_insert_own"
  on public.follows for insert
  to authenticated
  with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_own" on public.follows;
create policy "follows_delete_own"
  on public.follows for delete
  to authenticated
  using (auth.uid() = follower_id);

-- Blocks: only the blocker can see / manage their list
drop policy if exists "blocks_select_own" on public.blocks;
create policy "blocks_select_own"
  on public.blocks for select
  to authenticated
  using (auth.uid() = blocker_id);

drop policy if exists "blocks_insert_own" on public.blocks;
create policy "blocks_insert_own"
  on public.blocks for insert
  to authenticated
  with check (auth.uid() = blocker_id);

drop policy if exists "blocks_delete_own" on public.blocks;
create policy "blocks_delete_own"
  on public.blocks for delete
  to authenticated
  using (auth.uid() = blocker_id);

-- Profiles: guests + self always; hide people who blocked you;
-- still visible if YOU blocked them (unblock / manage list).
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_visible" on public.profiles;
create policy "profiles_select_visible"
  on public.profiles for select
  using (
    auth.uid() is null
    or id = auth.uid()
    or exists (
      select 1
      from public.blocks b
      where b.blocker_id = auth.uid() and b.blocked_id = profiles.id
    )
    or not exists (
      select 1
      from public.blocks b
      where b.blocker_id = profiles.id and b.blocked_id = auth.uid()
    )
  );

-- Posts: hide authors blocked either way for authenticated viewers
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select
  using (
    deleted_at is null
    and (
      auth.uid() is null
      or author_id = auth.uid()
      or not exists (
        select 1
        from public.blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = posts.author_id)
           or (b.blocker_id = posts.author_id and b.blocked_id = auth.uid())
      )
    )
  );

-- Profiles: own last_seen / counters already covered by profiles_update_own

-- =============================================================================
-- Done. Run this SQL in Supabase before testing follow / block / search.
-- =============================================================================
