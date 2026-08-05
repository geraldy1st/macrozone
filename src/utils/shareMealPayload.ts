import type { ShareMealPayload } from "@/components/community/ShareToCommunityModal";
import type { Meal } from "@/storage/meals";
import { formatRecipeDataAsText, hasRecipeContent } from "@/types/recipe";

export function mealToSharePayload(meal: Meal): ShareMealPayload {
  const recipeFromData =
    meal.recipeData && hasRecipeContent(meal.recipeData)
      ? formatRecipeDataAsText(meal.recipeData)
      : undefined;

  return {
    mealName: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    description: meal.description,
    recipe: recipeFromData || meal.recipe,
    localImageUri: meal.photoUri,
  };
}
