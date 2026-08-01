import type { User } from "@supabase/supabase-js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (normalized.length < 5 || normalized.length > 254) {
    return false;
  }
  return EMAIL_PATTERN.test(normalized);
}

/** True when the user can re-auth with email + password (not Google-only). */
export function userHasEmailPasswordAuth(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }

  const identities = user.identities ?? [];
  if (identities.length === 0) {
    // Session users without identities array still often have email/password
    return Boolean(user.email) && !user.app_metadata?.provider?.includes?.("google");
  }

  return identities.some((identity) => identity.provider === "email");
}
