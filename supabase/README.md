# Supabase — Community feed (A006)

## Phase A006a (current)

Foundation only: schema, RLS, Storage policies, TypeScript types + client services.

**No feed UI yet** — that is **A006b**.

## Apply the migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. **SQL Editor** → New query.
3. Paste the contents of  
   `migrations/20260719_community_feed.sql`
4. Run. Fix any errors (re-run is mostly idempotent with `if not exists` / `drop policy if exists`).

### After SQL

1. Confirm tables: `profiles`, `posts`, `likes`, `comments`.
2. Confirm Storage bucket: `meal-posts` (public).
3. Optional: Authentication → enable email signups as already configured.

### Backfill profiles for existing users

If users already exist before the trigger:

```sql
insert into public.profiles (id, display_name)
select
  id,
  coalesce(nullif(split_part(email, '@', 1), ''), 'User')
from auth.users
on conflict (id) do nothing;
```

## App code (already in repo)

| Path | Role |
|------|------|
| `src/types/community.ts` | Types |
| `src/services/community/` | Client API (posts, likes, comments, profiles) |

## Next phases

| Phase | Scope |
|-------|--------|
| **A006b** | Tab Community, `PostCard`, share after scan, image upload |
| **A006c** | Wire like / comment UI |
| **A006d** | Realtime (optional) |

## Privacy model (Option A)

- **Anyone** (including guests) can **read** posts, likes counts, comments.
- **Authenticated** users only can **create** posts, like, comment, delete their own content.
