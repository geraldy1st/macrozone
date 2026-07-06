import { AuthError } from "@supabase/supabase-js";

export type AuthFlowErrorCode =
  | "EMAIL_NOT_CONFIRMED"
  | "OAUTH_CANCELLED"
  | "OAUTH_SESSION_MISSING"
  | "AUTH_NOT_CONFIGURED"
  | "OAUTH_URL_MISSING";

export function getAuthErrorCode(error: unknown): AuthFlowErrorCode | null {
  if (!(error instanceof AuthError)) {
    if (error instanceof Error) {
      if (error.message === "OAUTH_CANCELLED") {
        return "OAUTH_CANCELLED";
      }

      if (error.message === "OAUTH_SESSION_MISSING") {
        return "OAUTH_SESSION_MISSING";
      }

      if (error.message === "AUTH_NOT_CONFIGURED") {
        return "AUTH_NOT_CONFIGURED";
      }

      if (error.message === "OAUTH_URL_MISSING") {
        return "OAUTH_URL_MISSING";
      }
    }

    return null;
  }

  if (error.code === "email_not_confirmed") {
    return "EMAIL_NOT_CONFIRMED";
  }

  const message = error.message.toLowerCase();

  if (message.includes("email not confirmed")) {
    return "EMAIL_NOT_CONFIRMED";
  }

  return null;
}