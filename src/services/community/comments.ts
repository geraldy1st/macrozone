import { supabase } from "@/lib/supabase";
import {
  MAX_COMMENT_LENGTH,
  type CommunityComment,
} from "@/types/community";

/** A006c-ready: list non-deleted comments for a post. */
export async function fetchComments(postId: string): Promise<CommunityComment[]> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      *,
      author:profiles!author_id ( id, display_name, avatar_url )
    `,
    )
    .eq("post_id", postId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const author = row.author as CommunityComment["author"] | CommunityComment["author"][];
    return {
      ...(row as CommunityComment),
      author: Array.isArray(author) ? author[0] ?? null : author,
    };
  });
}

/** A006c-ready: add a comment (authenticated). */
export async function addComment(
  postId: string,
  authorId: string,
  body: string,
): Promise<CommunityComment> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const trimmed = body.trim().slice(0, MAX_COMMENT_LENGTH);
  if (!trimmed) {
    throw new Error("COMMENT_EMPTY");
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: authorId,
      body: trimmed,
    })
    .select(
      `
      *,
      author:profiles!author_id ( id, display_name, avatar_url )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  const author = data.author as CommunityComment["author"] | CommunityComment["author"][];
  return {
    ...(data as CommunityComment),
    author: Array.isArray(author) ? author[0] ?? null : author,
  };
}

/** Soft-delete own comment. */
export async function deleteMyComment(
  commentId: string,
  authorId: string,
): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { error } = await supabase
    .from("comments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", commentId)
    .eq("author_id", authorId);

  if (error) {
    throw error;
  }
}
