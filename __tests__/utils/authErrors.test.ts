import { AuthError } from "@supabase/supabase-js";
import { getAuthErrorCode } from "@/utils/authErrors";

describe("getAuthErrorCode", () => {
  it("detects unconfirmed email errors", () => {
    const error = new AuthError("Email not confirmed", 400, "email_not_confirmed");

    expect(getAuthErrorCode(error)).toBe("EMAIL_NOT_CONFIRMED");
  });

  it("detects cancelled oauth flows", () => {
    expect(getAuthErrorCode(new Error("OAUTH_CANCELLED"))).toBe("OAUTH_CANCELLED");
  });
});