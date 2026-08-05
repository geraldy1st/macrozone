import { supabase } from "@/lib/supabase";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  MAX_CAPTION_LENGTH,
  MAX_RECIPE_EXCERPT_LENGTH,
  MEAL_POSTS_BUCKET,
  type CreatePostInput,
  type FeedPage,
  type FeedPost,
  type UpdatePostInput,
} from "@/types/community";
import { base64ToUint8Array } from "@/utils/base64";
import { prepareImageForUpload } from "@/utils/photos";
import { buildPostSearchOrFilter } from "@/utils/postSearch";

function createPostId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === "x" ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function publicImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath || !supabase) {
    return null;
  }

  const { data } = supabase.storage.from(MEAL_POSTS_BUCKET).getPublicUrl(imagePath);
  return data.publicUrl ?? null;
}

function mapFeedPost(row: Record<string, unknown>): FeedPost {
  const author = row.author as FeedPost["author"] | FeedPost["author"][] | null;
  const authorRow = Array.isArray(author) ? author[0] ?? null : author;

  return {
    id: row.id as string,
    author_id: row.author_id as string,
    meal_name: row.meal_name as string,
    caption: (row.caption as string) ?? "",
    calories: row.calories as number,
    protein: row.protein as number,
    carbs: row.carbs as number,
    fat: row.fat as number,
    image_path: (row.image_path as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    recipe_excerpt: (row.recipe_excerpt as string | null) ?? null,
    likes_count: (row.likes_count as number) ?? 0,
    comments_count: (row.comments_count as number) ?? 0,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string | null | undefined) ?? null,
    deleted_at: (row.deleted_at as string | null) ?? null,
    author: authorRow,
    image_url: publicImageUrl((row.image_path as string | null) ?? null),
    liked_by_me: Boolean(row.liked_by_me),
  };
}

/**
 * Upload a local image (file:// / content:// / data URL) to meal-posts.
 * Uses prepareImageForUpload so native Android/iOS work (not fetch().blob()).
 */
export async function uploadPostImage(
  userId: string,
  postId: string,
  localUri: string,
): Promise<string> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const prepared = await prepareImageForUpload(localUri);
  const bytes = base64ToUint8Array(prepared.base64);
  const path = `${userId}/${postId}.jpg`;

  const { error } = await supabase.storage.from(MEAL_POSTS_BUCKET).upload(path, bytes, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return path;
}

/**
 * Create a community post from a meal analysis / local meal snapshot.
 * Requires authenticated session. Profile must exist (use upsertMyProfile first).
 */
export async function createPost(
  authorId: string,
  input: CreatePostInput,
): Promise<FeedPost> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const postId = createPostId();
  let imagePath: string | null = null;

  if (input.localImageUri) {
    try {
      imagePath = await uploadPostImage(authorId, postId, input.localImageUri);
    } catch (error) {
      // On mobile, still allow text-only share if image upload fails hard.
      console.warn("Community image upload failed, posting without image:", error);
      imagePath = null;
    }
  }

  const caption = (input.caption ?? "").trim().slice(0, MAX_CAPTION_LENGTH);
  const recipeExcerpt = input.recipeExcerpt
    ?.trim()
    .slice(0, MAX_RECIPE_EXCERPT_LENGTH);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      id: postId,
      author_id: authorId,
      meal_name: input.mealName.trim(),
      caption,
      calories: Math.max(0, Math.round(input.calories)),
      protein: Math.max(0, Math.round(input.protein)),
      carbs: Math.max(0, Math.round(input.carbs)),
      fat: Math.max(0, Math.round(input.fat)),
      image_path: imagePath,
      description: input.description?.trim() || null,
      recipe_excerpt: recipeExcerpt || null,
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

  return mapFeedPost(data as Record<string, unknown>);
}

/**
 * Fetch latest public posts (paginated by created_at cursor).
 * Optional `query` filters by meal_name / caption (ilike).
 * Readable by guests (anon key) when RLS allows public SELECT.
 */
export async function fetchFeed(options?: {
  before?: string | null;
  limit?: number;
  currentUserId?: string | null;
  /** Free-text search on meal name and caption. */
  query?: string | null;
}): Promise<FeedPage> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const limit = options?.limit ?? COMMUNITY_FEED_PAGE_SIZE;
  const searchFilter = options?.query
    ? buildPostSearchOrFilter(options.query)
    : null;

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!author_id ( id, display_name, avatar_url )
    `,
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (searchFilter) {
    query = query.or(searchFilter);
  }

  if (options?.before) {
    query = query.lt("created_at", options.before);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  let likedSet = new Set<string>();

  if (options?.currentUserId && rows.length > 0) {
    const ids = rows.map((row) => row.id as string);
    const { data: likes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", options.currentUserId)
      .in("post_id", ids);

    likedSet = new Set((likes ?? []).map((like) => like.post_id as string));
  }

  const posts = rows.map((row) => {
    const post = mapFeedPost(row);
    return {
      ...post,
      liked_by_me: likedSet.has(post.id),
    };
  });

  const nextCursor =
    posts.length === limit ? posts[posts.length - 1]?.created_at ?? null : null;

  return { posts, nextCursor };
}

/** Fetch public posts by author (newest first), for profile grid. */
export async function fetchPostsByAuthor(
  authorId: string,
  options?: { limit?: number; before?: string | null },
): Promise<FeedPage> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const limit = options?.limit ?? COMMUNITY_FEED_PAGE_SIZE;

  let query = supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!author_id ( id, display_name, avatar_url )
    `,
    )
    .eq("author_id", authorId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (options?.before) {
    query = query.lt("created_at", options.before);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const posts = ((data ?? []) as Record<string, unknown>[]).map((row) =>
    mapFeedPost(row),
  );

  const nextCursor =
    posts.length === limit ? posts[posts.length - 1]?.created_at ?? null : null;

  return { posts, nextCursor };
}

/** Fetch a single public post by id. */
export async function fetchPostById(postId: string): Promise<FeedPost | null> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      *,
      author:profiles!author_id ( id, display_name, avatar_url )
    `,
    )
    .eq("id", postId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapFeedPost(data as Record<string, unknown>);
}

/** Soft-delete own post. */
export async function deleteMyPost(postId: string, authorId: string): Promise<void> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const { error } = await supabase
    .from("posts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("author_id", authorId);

  if (error) {
    throw error;
  }
}

/** Update own post caption / meal name (A009-2). */
export async function updateMyPost(
  postId: string,
  authorId: string,
  input: UpdatePostInput,
): Promise<FeedPost> {
  if (!supabase) {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  const patch: Record<string, unknown> = {};

  if (input.mealName !== undefined) {
    const name = input.mealName.trim();
    if (!name) {
      throw new Error("MEAL_NAME_REQUIRED");
    }
    patch.meal_name = name;
  }

  if (input.caption !== undefined) {
    patch.caption = input.caption.trim().slice(0, MAX_CAPTION_LENGTH);
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("NOTHING_TO_UPDATE");
  }

  // Ensure updated_at moves even if DB trigger is missing
  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("posts")
    .update(patch)
    .eq("id", postId)
    .eq("author_id", authorId)
    .is("deleted_at", null)
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

  return mapFeedPost(data as Record<string, unknown>);
}
