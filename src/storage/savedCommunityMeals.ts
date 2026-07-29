import type { FeedPost } from "@/types/community";
import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SAVED_COMMUNITY_KEY = "savedCommunityMeals";

export type SavedCommunityMeal = {
  /** Community post id */
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string;
  recipe?: string;
  caption?: string;
  imageUrl?: string;
  authorName?: string;
  authorId?: string;
  savedAt: string;
};

function getSavedKey() {
  return scopedKey(SAVED_COMMUNITY_KEY);
}

export async function getSavedCommunityMeals(): Promise<SavedCommunityMeal[]> {
  const data = await AsyncStorage.getItem(getSavedKey());
  if (!data) {
    return [];
  }

  const parsed: unknown = JSON.parse(data);
  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(
    (item): item is SavedCommunityMeal =>
      typeof item === "object" &&
      item !== null &&
      typeof (item as SavedCommunityMeal).id === "string" &&
      typeof (item as SavedCommunityMeal).name === "string",
  );
}

export async function getSavedCommunityMealIds(): Promise<string[]> {
  const meals = await getSavedCommunityMeals();
  return meals.map((meal) => meal.id);
}

export async function isCommunityMealSaved(postId: string): Promise<boolean> {
  const ids = await getSavedCommunityMealIds();
  return ids.includes(postId);
}

export function feedPostToSavedMeal(post: FeedPost): SavedCommunityMeal {
  return {
    id: post.id,
    name: post.meal_name,
    calories: post.calories,
    protein: post.protein,
    carbs: post.carbs,
    fat: post.fat,
    description: post.description ?? undefined,
    recipe: post.recipe_excerpt ?? undefined,
    caption: post.caption || undefined,
    imageUrl: post.image_url ?? undefined,
    authorName: post.author?.display_name ?? undefined,
    authorId: post.author_id,
    savedAt: new Date().toISOString(),
  };
}

export async function toggleSavedCommunityMeal(
  post: FeedPost,
): Promise<boolean> {
  const meals = await getSavedCommunityMeals();
  const exists = meals.some((meal) => meal.id === post.id);

  const next = exists
    ? meals.filter((meal) => meal.id !== post.id)
    : [feedPostToSavedMeal(post), ...meals];

  await AsyncStorage.setItem(getSavedKey(), JSON.stringify(next));
  return !exists;
}

export async function getSavedCommunityMealById(
  postId: string,
): Promise<SavedCommunityMeal | null> {
  const meals = await getSavedCommunityMeals();
  return meals.find((meal) => meal.id === postId) ?? null;
}

export async function removeSavedCommunityMeal(postId: string): Promise<void> {
  const meals = await getSavedCommunityMeals();
  const next = meals.filter((meal) => meal.id !== postId);
  await AsyncStorage.setItem(getSavedKey(), JSON.stringify(next));
}
