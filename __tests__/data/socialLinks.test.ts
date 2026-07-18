import { formatSocialUrlLabel, normalizeSocialUrl } from "@/data/socialLinks";

describe("normalizeSocialUrl", () => {
  it("accepts https URLs", () => {
    expect(normalizeSocialUrl("https://github.com/user")).toBe(
      "https://github.com/user",
    );
  });

  it("adds https when protocol is missing", () => {
    expect(normalizeSocialUrl("instagram.com/me")).toBe(
      "https://instagram.com/me",
    );
  });

  it("upgrades http to https", () => {
    expect(normalizeSocialUrl("http://example.com")).toBe("https://example.com/");
  });

  it("rejects empty or invalid values", () => {
    expect(normalizeSocialUrl("")).toBeNull();
    expect(normalizeSocialUrl("not a url")).toBeNull();
  });
});

describe("formatSocialUrlLabel", () => {
  it("shows host and path without protocol", () => {
    expect(formatSocialUrlLabel("https://github.com/user")).toBe("github.com/user");
  });
});
