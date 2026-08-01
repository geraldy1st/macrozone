import { supabase } from "@/lib/supabase";

export async function isFollowing(
  followerId: string,
  followingId: string,
): Promise<boolean> {
  if (!supabase || followerId === followingId) {
    return false;
  }

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data);
}

export async function followUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  if (followerId === followingId) {
    throw new Error("CANNOT_FOLLOW_SELF");
  }

  const { error } = await supabase.from("follows").insert({
    follower_id: followerId,
    following_id: followingId,
  });

  if (error) {
    // Idempotent if already following
    if (error.code === "23505") {
      return;
    }
    throw error;
  }
}

export async function unfollowUser(
  followerId: string,
  followingId: string,
): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("following_id", followingId);

  if (error) {
    throw error;
  }
}

export async function toggleFollow(
  followerId: string,
  followingId: string,
  currentlyFollowing: boolean,
): Promise<boolean> {
  if (currentlyFollowing) {
    await unfollowUser(followerId, followingId);
    return false;
  }

  await followUser(followerId, followingId);
  return true;
}
