import { scopedKey } from "@/storage/scopedKey";
import { deleteMealPhoto, saveMealPhoto, clearAllMealPhotos } from "@/utils/photos";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Meal = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: string;
  photoUri?: string;
  description?: string;
  recipe?: string;
  recipeSource?: "ai" | "user";
  recipeAuthorName?: string;
  templateId?: string;
};

const MEALS_KEY = "meals";

function getMealsKey() {
  return scopedKey(MEALS_KEY);
}

export const getMeals = async (): Promise<Meal[]> => {
  const data = await AsyncStorage.getItem(getMealsKey());
  return data ? JSON.parse(data) : [];
};

export const getMealById = async (id: string): Promise<Meal | null> => {
  const meals = await getMeals();
  return meals.find((meal) => meal.id === id) ?? null;
};

type MealInput = Omit<Meal, "id" | "createdAt" | "photoUri">;

type AddMealOptions = {
  copyPhotoUri?: string;
};

export const addMeal = async (
  meal: MealInput,
  tempPhotoUri?: string,
  options?: AddMealOptions,
): Promise<Meal> => {
  const meals = await getMeals();
  const id = Date.now().toString();
  let photoUri: string | undefined;

  if (tempPhotoUri) {
    photoUri = await saveMealPhoto(tempPhotoUri, id);
  } else if (options?.copyPhotoUri) {
    photoUri = await saveMealPhoto(options.copyPhotoUri, id);
  }

  const newMeal: Meal = {
    ...meal,
    id,
    photoUri,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(getMealsKey(), JSON.stringify([newMeal, ...meals]));
  return newMeal;
};

export const updateMeal = async (
  id: string,
  updates: Partial<MealInput> & { photoUri?: string | null },
): Promise<Meal | null> => {
  const meals = await getMeals();
  const index = meals.findIndex((meal) => meal.id === id);

  if (index === -1) {
    return null;
  }

  const current = meals[index];
  let photoUri = current.photoUri;

  if (updates.photoUri === null) {
    if (photoUri) {
      await deleteMealPhoto(photoUri);
    }
    photoUri = undefined;
  } else if (updates.photoUri) {
    photoUri = updates.photoUri;
  }

  const updatedMeal: Meal = {
    ...current,
    ...updates,
    photoUri,
    id: current.id,
    createdAt: current.createdAt,
  };

  meals[index] = updatedMeal;
  await AsyncStorage.setItem(getMealsKey(), JSON.stringify(meals));
  return updatedMeal;
};

export const deleteMeal = async (id: string): Promise<void> => {
  await deleteMeals([id]);
};

export const deleteMeals = async (ids: string[]): Promise<void> => {
  if (ids.length === 0) {
    return;
  }

  const meals = await getMeals();
  const idSet = new Set(ids);

  for (const meal of meals) {
    if (idSet.has(meal.id) && meal.photoUri) {
      await deleteMealPhoto(meal.photoUri);
    }
  }

  const filtered = meals.filter((item) => !idSet.has(item.id));
  await AsyncStorage.setItem(getMealsKey(), JSON.stringify(filtered));
};

export const clearAllMeals = async (): Promise<void> => {
  await clearAllMealPhotos();
  await AsyncStorage.removeItem(getMealsKey());
};