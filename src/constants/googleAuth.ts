import Constants from "expo-constants";

/**
 * Google OAuth **Web** client ID (public — not the client secret).
 * Set via EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in `.env` (local) and EAS env (builds).
 * Must match the Web client configured in Supabase → Auth → Google.
 */
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
  (Constants.expoConfig?.extra?.googleWebClientId as string | undefined) ??
  "";
