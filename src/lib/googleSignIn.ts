import { isExpoGo } from "@/utils/runtime";
import { Platform } from "react-native";

type GoogleSigninApi =
  typeof import("@react-native-google-signin/google-signin").GoogleSignin;

let cached: GoogleSigninApi | null | undefined;

/**
 * Native Google Sign-In is unavailable in Expo Go and on web.
 * A missing TurboModule must never be imported at module top-level.
 */
export function getNativeGoogleSignin(): GoogleSigninApi | null {
  if (Platform.OS === "web" || isExpoGo()) {
    return null;
  }

  if (cached !== undefined) {
    return cached;
  }

  try {
    const mod = require("@react-native-google-signin/google-signin") as {
      GoogleSignin?: GoogleSigninApi;
    };
    cached = mod.GoogleSignin ?? null;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
