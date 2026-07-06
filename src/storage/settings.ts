import { scopedKey } from "@/storage/scopedKey";
import type { ThemeMode } from "@/styles/themes";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LANGUAGE_KEY = "appLanguage";
const THEME_KEY = "appTheme";

function getLanguageKey() {
  return scopedKey(LANGUAGE_KEY);
}

export const supportedLanguages = ["en", "fr"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: AppLanguage = "en";

export const getStoredLanguage = async (): Promise<AppLanguage | null> => {
  const value = await AsyncStorage.getItem(getLanguageKey());
  if (value === "en" || value === "fr") {
    return value;
  }
  return null;
};

export const setStoredLanguage = async (language: AppLanguage): Promise<void> => {
  await AsyncStorage.setItem(getLanguageKey(), language);
};

function getThemeKey() {
  return scopedKey(THEME_KEY);
}

export async function getStoredTheme(): Promise<ThemeMode | null> {
  const value = await AsyncStorage.getItem(getThemeKey());
  return value === "light" || value === "dark" ? value : null;
}

export async function setStoredTheme(theme: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(getThemeKey(), theme);
}