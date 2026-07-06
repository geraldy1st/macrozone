import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const LANGUAGE_KEY = "appLanguage";

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