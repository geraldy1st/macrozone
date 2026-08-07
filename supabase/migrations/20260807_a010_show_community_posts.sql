-- =============================================================================
-- A010-2 — Profile: optional visibility of community posts on public profile
-- Apply in Supabase Dashboard → SQL Editor (or via supabase CLI).
-- =============================================================================

alter table public.profiles
  add column if not exists show_community_posts boolean not null default true;

comment on column public.profiles.show_community_posts is
  'When false, community post grid is hidden on public profile (owner can still post).';
