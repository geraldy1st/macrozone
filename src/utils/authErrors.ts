import { AuthError } from "@supabase/supabase-js";

export type AuthFlowErrorCode =
  | "EMAIL_NOT_CONFIRMED"
  | "OAUTH_CANCELLED"
  | "OAUTH_SESSION_MISSING"
  | "AUTH_NOT_CONFIGURED"
  | "OAUTH_URL_MISSING"
  | "EMAIL_CHANGE_OAUTH_ONLY"
  | "EMAIL_INVALID"
  | "EMAIL_UNCHANGED"
  | "EMAIL_PASSWORD_REQUIRED"
  | "EMAIL_ALREADY_REGISTERED"
  | "GOOGLE_WEB_CLIENT_ID_MISSING";

const SIMPLE_ERROR_CODES: AuthFlowErrorCode[] = [
  "OAUTH_CANCELLED",
  "OAUTH_SESSION_MISSING",
  "AUTH_NOT_CONFIGURED",
  "OAUTH_URL_MISSING",
  "EMAIL_CHANGE_OAUTH_ONLY",
  "EMAIL_INVALID",
  "EMAIL_UNCHANGED",
  "EMAIL_PASSWORD_REQUIRED",
  "GOOGLE_WEB_CLIENT_ID_MISSING",
];

export function getAuthErrorCode(error: unknown): AuthFlowErrorCode | null {
  if (!(error instanceof AuthError)) {
    if (error instanceof Error) {
      if (SIMPLE_ERROR_CODES.includes(error.message as AuthFlowErrorCode)) {
        return error.message as AuthFlowErrorCode;
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

  if (
    error.code === "email_exists" ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already registered")
  ) {
    return "EMAIL_ALREADY_REGISTERED";
  }

  return null;
}