const mockExchangeCodeForSession = jest.fn();
const mockVerifyOtp = jest.fn();
const mockSetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
      verifyOtp: (...args: unknown[]) => mockVerifyOtp(...args),
      setSession: (...args: unknown[]) => mockSetSession(...args),
      getSession: jest.fn(),
    },
  },
}));

import { createSessionFromUrl } from "@/utils/authSession";

describe("createSessionFromUrl", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("exchanges a PKCE code for a session", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: "token" } },
      error: null,
    });

    const session = await createSessionFromUrl(
      "macrozone://auth/callback?code=abc123",
    );

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(session).toEqual({ access_token: "token" });
  });

  it("verifies email confirmation links", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: { access_token: "verified" } },
      error: null,
    });

    const session = await createSessionFromUrl(
      "macrozone://auth/callback?token_hash=hash123&type=signup",
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: "hash123",
      type: "signup",
    });
    expect(session).toEqual({ access_token: "verified" });
  });

  it("verifies password recovery links", async () => {
    mockVerifyOtp.mockResolvedValue({
      data: { session: { access_token: "recovery" } },
      error: null,
    });

    const session = await createSessionFromUrl(
      "macrozone://auth/callback?token_hash=hash456&type=recovery",
    );

    expect(mockVerifyOtp).toHaveBeenCalledWith({
      token_hash: "hash456",
      type: "recovery",
    });
    expect(session).toEqual({ access_token: "recovery" });
  });

  it("falls back to implicit tokens when present", async () => {
    mockSetSession.mockResolvedValue({
      data: { session: { access_token: "implicit" } },
      error: null,
    });

    const session = await createSessionFromUrl(
      "macrozone://auth/callback?access_token=implicit&refresh_token=refresh",
    );

    expect(mockSetSession).toHaveBeenCalledWith({
      access_token: "implicit",
      refresh_token: "refresh",
    });
    expect(session).toEqual({ access_token: "implicit" });
  });
});