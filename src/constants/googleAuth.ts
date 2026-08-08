import Constants from "expo-constants";

/**
 * Google OAuth **Web** client ID (public — not the client secret).
 * Set via EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in `.env` (local) and EAS env (builds).
 * Must match the Web client configured in Supabase → Auth → Google.
 * Used as `webClientId` so the ID token audience works with Supabase signInWithIdToken.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  (Constants.expoConfig?.extra?.googleWebClientId as string | undefined) ??
  "";

/**
 * Google OAuth **iOS** client ID (public).
 * Create in Google Cloud → Credentials → OAuth client → type iOS
 * with Bundle ID `com.geraldy.macrozone`.
 * Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID in `.env` and EAS (preview / production).
 * Also drives `iosUrlScheme` via app.config.js (required for native Google Sign-In).
 */
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
  (Constants.expoConfig?.extra?.googleIosClientId as string | undefined) ??
  "";
