import Constants from "expo-constants";

export const ANALYZE_API_URL =
  process.env.EXPO_PUBLIC_ANALYZE_API_URL ??
  Constants.expoConfig?.extra?.analyzeApiUrl ??
  "";

function deriveSiblingEndpoint(baseUrl: string, endpoint: string) {
  if (/\/analyze-meal\/?$/.test(baseUrl)) {
    return baseUrl.replace(/\/analyze-meal\/?$/, `/${endpoint}`);
  }

  return `${baseUrl.replace(/\/$/, "")}/${endpoint}`;
}

export const ANALYZE_RECIPE_API_URL =
  process.env.EXPO_PUBLIC_ANALYZE_RECIPE_API_URL ??
  Constants.expoConfig?.extra?.analyzeRecipeApiUrl ??
  (ANALYZE_API_URL ? deriveSiblingEndpoint(ANALYZE_API_URL, "analyze-recipe") : "");

export const MACROZONE_API_KEY =
  process.env.EXPO_PUBLIC_MACROZONE_API_KEY ??
  Constants.expoConfig?.extra?.macrozoneApiKey ??
  "";