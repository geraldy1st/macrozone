import {
  isValidEmail,
  normalizeEmail,
  userHasEmailPasswordAuth,
} from "@/utils/email";
import type { User } from "@supabase/supabase-js";

function mockUser(partial: Partial<User> & { identities?: User["identities"] }): User {
  return {
    id: "user-1",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "",
    ...partial,
  } as User;
}

describe("email utils", () => {
  it("normalizes and validates emails", () => {
    expect(normalizeEmail("  Alex@Example.COM ")).toBe("alex@example.com");
    expect(isValidEmail("alex@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });

  it("detects email/password identity", () => {
    expect(
      userHasEmailPasswordAuth(
        mockUser({
          email: "a@b.com",
          identities: [{ provider: "email" } as never],
        }),
      ),
    ).toBe(true);

    expect(
      userHasEmailPasswordAuth(
        mockUser({
          email: "a@b.com",
          identities: [{ provider: "google" } as never],
        }),
      ),
    ).toBe(false);
  });
});
