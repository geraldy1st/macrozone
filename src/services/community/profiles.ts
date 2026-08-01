import { supabase } from "@/lib/supabase";
import {
  PROFILE_SEARCH_PAGE_SIZE,
  type CommunityProfile,
  type ProfileListItem,
  type PublicProfileView,
} from "@/types/community";
import { isUserOnline } from "@/utils/presence";
import { isBlockedByMe } from "./blocks";
import { isFollowing } from "./follows";

function mapProfile(row: Record<string, unknown>): CommunityProfile {
  return {
    id: row.id as string,
    display_name: (row.display_name as string) ?? "",
    avatar_url: (row.avatar_url as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    followers_count: (row.followers_count as number | undefined) ?? 0,
    following_count: (row.following_count as number | undefined) ?? 0,
    last_seen_at: (row.last_seen_at as string | null | undefined) ?? null,
  };
}

/**
 * Ensure a profiles row exists and is up to date for the signed-in user.
 * Call after login / before creating a post.
 * Pass `avatarUrl: undefined` to leave avatar unchanged; `null` clears it.
 */
export async function upsertMyProfile(input: {
  userId: string;
  displayName: string;
  avatarUrl?: string | null;
}): Promise<CommunityProfile> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const displayName = input.displayName.trim() || "User";

  const payload: Record<string, unknown> = {
    id: input.userId,
    display_name: displayName.slice(0, 40),
    updated_at: new Date().toISOString(),
  };

  if (input.avatarUrl !== undefined) {
    payload.avatar_url = input.avatarUrl;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data as Record<string, unknown>);
}

/** Update last_seen_at for presence (throttled by caller). */
export async function touchLastSeen(userId: string): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    // Presence is best-effort; ignore if column not migrated yet
    console.warn("touchLastSeen failed:", error.message);
  }
}

export async function getProfile(
  userId: string,
): Promise<CommunityProfile | null> {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapProfile(data as Record<string, unknown>);
}

export async function getPublicProfileView(
  profileId: string,
  currentUserId?: string | null,
): Promise<PublicProfileView | null> {
  const profile = await getProfile(profileId);
  if (!profile) {
    return null;
  }

  const isSelf = Boolean(currentUserId && currentUserId === profileId);

  let following = false;
  let blocked = false;

  if (currentUserId && !isSelf) {
    [following, blocked] = await Promise.all([
      isFollowing(currentUserId, profileId),
      isBlockedByMe(currentUserId, profileId),
    ]);
  }

  return {
    profile,
    isFollowing: following,
    isBlocked: blocked,
    isSelf,
  };
}

/**
 * Search public profiles by display_name (ilike).
 * Excludes the current user. Blocked users are hidden by RLS.
 */
export async function searchProfiles(options: {
  query: string;
  currentUserId?: string | null;
  limit?: number;
}): Promise<ProfileListItem[]> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const limit = options.limit ?? PROFILE_SEARCH_PAGE_SIZE;
  const raw = options.query.trim().replace(/[%_,."'()\\]/g, " ").replace(/\s+/g, " ").trim();

  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, avatar_url, created_at, updated_at, followers_count, following_count, last_seen_at",
    )
    .order("followers_count", { ascending: false })
    .limit(limit);

  if (raw) {
    query = query.ilike("display_name", `%${raw}%`);
  }

  if (options.currentUserId) {
    query = query.neq("id", options.currentUserId);

    // Exclude people I blocked (still visible via blocks join for manage list)
    const { data: blockedRows } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", options.currentUserId);

    const blockedIds = (blockedRows ?? []).map((row) => row.blocked_id as string);
    if (blockedIds.length > 0) {
      query = query.not("id", "in", `(${blockedIds.join(",")})`);
    }
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const profiles = (data ?? []).map((row) =>
    mapProfile(row as Record<string, unknown>),
  );

  let followingSet = new Set<string>();

  if (options.currentUserId && profiles.length > 0) {
    const ids = profiles.map((p) => p.id);
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", options.currentUserId)
      .in("following_id", ids);

    followingSet = new Set(
      (follows ?? []).map((row) => row.following_id as string),
    );
  }

  return profiles.map((profile) => ({
    ...profile,
    is_online: isUserOnline(profile.last_seen_at),
    is_following: followingSet.has(profile.id),
  }));
}
