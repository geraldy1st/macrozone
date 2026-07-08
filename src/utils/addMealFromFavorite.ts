import { filterMealsForToday } from "@/utils/groupMealsByDay";
import { getMeals, addMeal, type Meal } from "@/storage/meals";

export function isMealAlreadyLoggedToday(
  meals: Meal[],
  templateId: string,
): boolean {
  const todayMeals = filterMealsForToday(meals);
  return todayMeals.some(
    (meal) => meal.templateId === templateId || meal.id === templateId,
  );
}

export async function addFavoriteMealForToday(templateMeal: Meal) {
  return addMeal(
    {
      name: templateMeal.name,
      calories: templateMeal.calories,
      protein: templateMeal.protein,
      carbs: templateMeal.carbs,
      fat: templateMeal.fat,
      description: templateMeal.description,
      recipe: templateMeal.recipe,
      templateId: templateMeal.id,
    },
    undefined,
    { copyPhotoUri: templateMeal.photoUri },
  );
}

export async function checkFavoriteDuplicateToday(templateId: string) {
  const meals = await getMeals();
  return isMealAlreadyLoggedToday(meals, templateId);
}