import {
  buildSocialUrl,
  formatSocialUrlLabel,
  normalizeSocialUsername,
} from "@/data/socialLinks";

describe("normalizeSocialUsername", () => {
  it("keeps a plain username", () => {
    expect(normalizeSocialUsername("github", "geraldy")).toBe("geraldy");
    expect(normalizeSocialUsername("instagram", "@geraldy")).toBe("geraldy");
  });

  it("extracts username from a full URL", () => {
    expect(normalizeSocialUsername("github", "https://github.com/geraldy")).toBe(
      "geraldy",
    );
    expect(
      normalizeSocialUsername("instagram", "https://instagram.com/geraldy"),
    ).toBe("geraldy");
  });

  it("rejects empty or invalid values", () => {
    expect(normalizeSocialUsername("github", "")).toBeNull();
    expect(normalizeSocialUsername("github", "not a name")).toBeNull();
  });
});

describe("buildSocialUrl", () => {
  it("builds platform URLs from usernames", () => {
    expect(buildSocialUrl("github", "geraldy")).toBe("https://github.com/geraldy");
    expect(buildSocialUrl("youtube", "channel")).toBe("https://youtube.com/@channel");
    expect(buildSocialUrl("website", "example.com")).toBe("https://example.com");
  });
});

describe("formatSocialUrlLabel", () => {
  it("shows username only without protocol", () => {
    expect(formatSocialUrlLabel("geraldy")).toBe("geraldy");
    expect(formatSocialUrlLabel("https://github.com/geraldy")).toBe("geraldy");
    expect(formatSocialUrlLabel("@geraldy")).toBe("geraldy");
  });
});
