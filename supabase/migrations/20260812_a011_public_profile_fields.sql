-- =============================================================================
-- A011-2 — Public profile fields: bio, country, social links
-- Apply in Supabase Dashboard → SQL Editor (or via supabase CLI).
-- =============================================================================

alter table public.profiles
  add column if not exists bio text not null default '';

alter table public.profiles
  add column if not exists country_code text;

alter table public.profiles
  add column if not exists social_links jsonb not null default '[]'::jsonb;

comment on column public.profiles.bio is
  'Public bio (synced from app profile edit). Max ~400 chars enforced client-side.';

comment on column public.profiles.country_code is
  'ISO country code (e.g. FR) for public display.';

comment on column public.profiles.social_links is
  'JSON array of { platform, url } public social handles.';
