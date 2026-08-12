import { isGoogleHostedAvatar } from "@/services/community/syncProfile";

describe("isGoogleHostedAvatar", () => {
  it("detects Google avatar hosts", () => {
    expect(
      isGoogleHostedAvatar(
        "https://lh3.googleusercontent.com/a/ACg8ocExample=s96-c",
      ),
    ).toBe(true);
    expect(isGoogleHostedAvatar("https://example.com/photo.jpg")).toBe(false);
    expect(isGoogleHostedAvatar(null)).toBe(false);
  });
});
