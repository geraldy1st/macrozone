/** Community feed types (A006) — aligned with supabase/migrations. */

export type CommunityProfile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunityPost = {
  id: string;
  author_id: string;
  meal_name: string;
  caption: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  image_path: string | null;
  description: string | null;
  recipe_excerpt: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  deleted_at: string | null;
};

/** Post row joined with author profile for feed cards. */
export type FeedPost = CommunityPost & {
  author: Pick<CommunityProfile, "id" | "display_name" | "avatar_url"> | null;
  /** Present when the current user liked this post. */
  liked_by_me?: boolean;
  /** Public URL derived from image_path (client-side). */
  image_url?: string | null;
};

export type CommunityLike = {
  post_id: string;
  user_id: string;
  created_at: string;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
  author?: Pick<CommunityProfile, "id" | "display_name" | "avatar_url"> | null;
};

export type CreatePostInput = {
  mealName: string;
  caption?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string;
  recipeExcerpt?: string;
  /** Local file URI to upload (optional). */
  localImageUri?: string;
};

export type FeedPage = {
  posts: FeedPost[];
  /** Pass as `before` cursor for next page (created_at of last item). */
  nextCursor: string | null;
};

export const COMMUNITY_FEED_PAGE_SIZE = 20;
export const MEAL_POSTS_BUCKET = "meal-posts";
export const MAX_CAPTION_LENGTH = 280;
export const MAX_COMMENT_LENGTH = 500;
export const MAX_RECIPE_EXCERPT_LENGTH = 500;
