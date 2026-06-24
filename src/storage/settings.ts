import AsyncStorage from "@react-native-async-storage/async-storage";

export const LANGUAGE_KEY = "appLanguage";

export const supportedLanguages = ["en", "fr"] as const;
export type AppLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: AppLanguage = "en";

export const getStoredLanguage = async (): Promise<AppLanguage | null> => {
  const value = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (value === "en" || value === "fr") {
    return value;
  }
  return null;
};

export const setStoredLanguage = async (language: AppLanguage): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
};