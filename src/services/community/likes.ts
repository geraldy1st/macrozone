import { supabase } from "@/lib/supabase";

/** A006c-ready: like a post (authenticated). */
export async function likePost(postId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { error } = await supabase.from("likes").insert({
    post_id: postId,
    user_id: userId,
  });

  if (error && error.code !== "23505") {
    // 23505 = already liked (unique violation)
    throw error;
  }
}

/** A006c-ready: remove like. */
export async function unlikePost(postId: string, userId: string): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function toggleLike(
  postId: string,
  userId: string,
  currentlyLiked: boolean,
): Promise<boolean> {
  if (currentlyLiked) {
    await unlikePost(postId, userId);
    return false;
  }

  await likePost(postId, userId);
  return true;
}
