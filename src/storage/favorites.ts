import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FAVORITES_KEY = "favoriteMeals";

function getFavoritesKey() {
  return scopedKey(FAVORITES_KEY);
}

export async function getFavoriteIds(): Promise<string[]> {
  const data = await AsyncStorage.getItem(getFavoritesKey());
  if (!data) {
    return [];
  }

  const parsed: unknown = JSON.parse(data);
  return Array.isArray(parsed)
    ? parsed.filter((id): id is string => typeof id === "string")
    : [];
}

export async function isFavorite(mealId: string): Promise<boolean> {
  const favorites = await getFavoriteIds();
  return favorites.includes(mealId);
}

export async function toggleFavorite(mealId: string): Promise<boolean> {
  const favorites = await getFavoriteIds();
  const isCurrentlyFavorite = favorites.includes(mealId);

  const nextFavorites = isCurrentlyFavorite
    ? favorites.filter((id) => id !== mealId)
    : [...favorites, mealId];

  await AsyncStorage.setItem(getFavoritesKey(), JSON.stringify(nextFavorites));
  return !isCurrentlyFavorite;
}