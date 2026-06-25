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
};

const MEALS_KEY = "meals";

export const getMeals = async (): Promise<Meal[]> => {
  const data = await AsyncStorage.getItem(MEALS_KEY);
  return data ? JSON.parse(data) : [];
};

export const addMeal = async (
  meal: Omit<Meal, "id" | "createdAt" | "photoUri">,
  tempPhotoUri?: string,
): Promise<Meal> => {
  const meals = await getMeals();
  const id = Date.now().toString();
  let photoUri: string | undefined;

  if (tempPhotoUri) {
    photoUri = await saveMealPhoto(tempPhotoUri, id);
  }

  const newMeal: Meal = {
    ...meal,
    id,
    photoUri,
    createdAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify([newMeal, ...meals]));
  return newMeal;
};

export const deleteMeal = async (id: string): Promise<void> => {
  const meals = await getMeals();
  const meal = meals.find((item) => item.id === id);

  if (meal?.photoUri) {
    await deleteMealPhoto(meal.photoUri);
  }

  const filtered = meals.filter((item) => item.id !== id);
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(filtered));
};

export const clearAllMeals = async (): Promise<void> => {
  await clearAllMealPhotos();
  await AsyncStorage.removeItem(MEALS_KEY);
};