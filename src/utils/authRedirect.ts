import { makeRedirectUri } from "expo-auth-session";

export function getAuthRedirectUri() {
  return makeRedirectUri({
    scheme: "macrozone",
    path: "auth/callback",
  });
}