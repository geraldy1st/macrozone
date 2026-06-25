import Constants from "expo-constants";

export const ANALYZE_API_URL =
  process.env.EXPO_PUBLIC_ANALYZE_API_URL ??
  Constants.expoConfig?.extra?.analyzeApiUrl ??
  "";

export const MACROZONE_API_KEY =
  process.env.EXPO_PUBLIC_MACROZONE_API_KEY ??
  Constants.expoConfig?.extra?.macrozoneApiKey ??
  "";