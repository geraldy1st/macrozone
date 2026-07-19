-- =============================================================================
-- A006a — Community feed foundation (Macrozone / nutriFlow)
-- Apply in Supabase Dashboard → SQL Editor (or via supabase CLI).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles (public-facing author info; id = auth.users.id)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_display_name_idx
  on public.profiles (display_name);

-- Auto-create profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'User'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. Posts (snapshot of a shared meal — public MVP)
-- -----------------------------------------------------------------------------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  meal_name text not null,
  caption text not null default '',
  calories integer not null check (calories >= 0),
  protein integer not null default 0 check (protein >= 0),
  carbs integer not null default 0 check (carbs >= 0),
  fat integer not null default 0 check (fat >= 0),
  -- Storage path in bucket meal-posts, e.g. {user_id}/{post_id}.jpg
  image_path text,
  description text,
  recipe_excerpt text,
  -- Denormalized counters (updated by triggers) for feed performance
  likes_count integer not null default 0 check (likes_count >= 0),
  comments_count integer not null default 0 check (comments_count >= 0),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists posts_feed_idx
  on public.posts (created_at desc)
  where deleted_at is null;

create index if not exists posts_author_idx
  on public.posts (author_id, created_at desc)
  where deleted_at is null;

-- -----------------------------------------------------------------------------
-- 3. Likes (ready for A006c — included now so RLS is complete)
-- -----------------------------------------------------------------------------
create table if not exists public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists likes_user_idx on public.likes (user_id);

-- -----------------------------------------------------------------------------
-- 4. Comments (ready for A006c)
-- -----------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 500),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists comments_post_idx
  on public.comments (post_id, created_at asc)
  where deleted_at is null;

-- -----------------------------------------------------------------------------
-- 5. Counter triggers
-- -----------------------------------------------------------------------------
create or replace function public.bump_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set likes_count = likes_count + 1
    where id = new.post_id and deleted_at is null;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
    set likes_count = greatest(likes_count - 1, 0)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count_insert on public.likes;
create trigger likes_count_insert
  after insert on public.likes
  for each row execute function public.bump_likes_count();

drop trigger if exists likes_count_delete on public.likes;
create trigger likes_count_delete
  after delete on public.likes
  for each row execute function public.bump_likes_count();

create or replace function public.bump_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set comments_count = comments_count + 1
    where id = new.post_id and deleted_at is null;
    return new;
  elsif tg_op = 'UPDATE' and new.deleted_at is not null and old.deleted_at is null then
    update public.posts
    set comments_count = greatest(comments_count - 1, 0)
    where id = new.post_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.posts
    set comments_count = greatest(comments_count - 1, 0)
    where id = old.post_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_count_change on public.comments;
create trigger comments_count_change
  after insert or update or delete on public.comments
  for each row execute function public.bump_comments_count();

-- -----------------------------------------------------------------------------
-- 6. Row Level Security
-- Option A: anyone can READ public content; interactions require auth.
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Profiles: public read; own row insert/update
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
  on public.profiles for select
  using (true);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Posts: public read (non-deleted); own insert / soft-delete update
drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
  on public.posts for select
  using (deleted_at is null);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- Likes
drop policy if exists "likes_select_all" on public.likes;
create policy "likes_select_all"
  on public.likes for select
  using (true);

drop policy if exists "likes_insert_own" on public.likes;
create policy "likes_insert_own"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "likes_delete_own" on public.likes;
create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- Comments
drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public"
  on public.comments for select
  using (deleted_at is null);

drop policy if exists "comments_insert_own" on public.comments;
create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own"
  on public.comments for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- -----------------------------------------------------------------------------
-- 7. Storage bucket for post images
-- Dashboard → Storage → New bucket "meal-posts" (public) if not created by SQL.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-posts',
  'meal-posts',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read
drop policy if exists "meal_posts_public_read" on storage.objects;
create policy "meal_posts_public_read"
  on storage.objects for select
  using (bucket_id = 'meal-posts');

-- Authenticated users upload only under their own folder: {user_id}/...
drop policy if exists "meal_posts_insert_own" on storage.objects;
create policy "meal_posts_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'meal-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "meal_posts_update_own" on storage.objects;
create policy "meal_posts_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'meal-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "meal_posts_delete_own" on storage.objects;
create policy "meal_posts_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'meal-posts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================================
-- Done. Next (A006b): app UI + create post after scan + feed screen.
-- =============================================================================
