import { addMeal } from "@/storage/meals";
import type { FeedPost } from "@/types/community";
import { checkFavoriteDuplicateToday } from "@/utils/addMealFromFavorite";

export function communityTemplateId(postId: string) {
  return `community:${postId}`;
}

type CommunityMealSource = Pick<
  FeedPost,
  | "id"
  | "meal_name"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "description"
  | "recipe_excerpt"
  | "image_url"
> & {
  author?: { display_name?: string | null } | null;
};

export async function addCommunityMealForToday(post: CommunityMealSource) {
  const input = {
    name: post.meal_name,
    calories: post.calories,
    protein: post.protein,
    carbs: post.carbs,
    fat: post.fat,
    description: post.description ?? undefined,
    recipe: post.recipe_excerpt ?? undefined,
    recipeSource: "user" as const,
    recipeAuthorName: post.author?.display_name?.trim() || undefined,
    templateId: communityTemplateId(post.id),
  };

  if (post.image_url) {
    try {
      return await addMeal(input, undefined, { copyPhotoUri: post.image_url });
    } catch {
      // Remote catalog photos may fail to copy; still log the meal.
    }
  }

  return addMeal(input);
}

export async function checkCommunityDuplicateToday(postId: string) {
  return checkFavoriteDuplicateToday(communityTemplateId(postId));
}
