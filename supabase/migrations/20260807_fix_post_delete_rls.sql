-- =============================================================================
-- Fix soft-delete of own posts: authors can still SELECT their deleted rows
-- (needed for reliable updates / verification). Public feed still hides them.
-- =============================================================================

drop policy if exists "posts_select_public" on public.posts;

create policy "posts_select_public"
  on public.posts for select
  using (
    -- Authors always see their own posts (including soft-deleted)
    (auth.uid() is not null and author_id = auth.uid())
    or (
      deleted_at is null
      and (
        auth.uid() is null
        or not exists (
          select 1
          from public.blocks b
          where (b.blocker_id = auth.uid() and b.blocked_id = posts.author_id)
             or (b.blocker_id = posts.author_id and b.blocked_id = auth.uid())
        )
      )
    )
  );

-- Ensure hard-delete policy exists for fallback client path
drop policy if exists "posts_delete_own" on public.posts;
create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);
