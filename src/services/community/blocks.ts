import { supabase } from "@/lib/supabase";
import type { CommunityProfile } from "@/types/community";

export async function isBlockedByMe(
  blockerId: string,
  blockedId: string,
): Promise<boolean> {
  if (!supabase || blockerId === blockedId) {
    return false;
  }

  const { data, error } = await supabase
    .from("blocks")
    .select("blocker_id")
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function blockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  if (blockerId === blockedId) {
    throw new Error("CANNOT_BLOCK_SELF");
  }

  const { error } = await supabase.from("blocks").insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });

  if (error) {
    if (error.code === "23505") {
      return;
    }
    throw error;
  }
}

export async function unblockUser(
  blockerId: string,
  blockedId: string,
): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { error } = await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);

  if (error) {
    throw error;
  }
}

/** List profiles I have blocked (with display info). */
export async function listBlockedProfiles(
  blockerId: string,
): Promise<CommunityProfile[]> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("blocks")
    .select(
      `
      blocked_id,
      created_at,
      profile:profiles!blocked_id (
        id,
        display_name,
        avatar_url,
        created_at,
        updated_at,
        followers_count,
        following_count,
        last_seen_at
      )
    `,
    )
    .eq("blocker_id", blockerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? [])
    .map((row) => {
      const profile = row.profile as CommunityProfile | CommunityProfile[] | null;
      return Array.isArray(profile) ? profile[0] ?? null : profile;
    })
    .filter((p): p is CommunityProfile => Boolean(p));
}
