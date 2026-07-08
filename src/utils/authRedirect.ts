import { makeRedirectUri } from "expo-auth-session";
import { Platform } from "react-native";

export const AUTH_REDIRECT_SCHEME = "macrozone";
export const AUTH_CALLBACK_PATH = "auth/callback";
export const NATIVE_AUTH_REDIRECT_URI = `${AUTH_REDIRECT_SCHEME}://${AUTH_CALLBACK_PATH}`;

export function getAuthRedirectUri() {
  if (Platform.OS === "web") {
    return makeRedirectUri({
      scheme: AUTH_REDIRECT_SCHEME,
      path: AUTH_CALLBACK_PATH,
    });
  }

  return NATIVE_AUTH_REDIRECT_URI;
}