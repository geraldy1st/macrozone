import {
  normalizeLinkUrl,
  parseTextWithLinks,
} from "@/utils/linkify";

describe("linkify", () => {
  it("normalizes bare and https URLs", () => {
    expect(normalizeLinkUrl("https://youtu.be/abc")).toBe("https://youtu.be/abc");
    expect(normalizeLinkUrl("www.instagram.com/user")).toBe(
      "https://www.instagram.com/user",
    );
  });

  it("parses mixed text with youtube and instagram links", () => {
    const segments = parseTextWithLinks(
      "Watch https://youtu.be/abc and https://www.instagram.com/p/xyz cool",
    );

    expect(segments.some((s) => s.type === "link" && s.value.includes("youtu.be"))).toBe(
      true,
    );
    expect(
      segments.some((s) => s.type === "link" && s.value.includes("instagram.com")),
    ).toBe(true);
    expect(segments.some((s) => s.type === "text" && s.value.includes("Watch"))).toBe(
      true,
    );
  });

  it("strips trailing punctuation from links", () => {
    const segments = parseTextWithLinks("See https://youtube.com/watch?v=1.");
    const link = segments.find((s) => s.type === "link");
    expect(link && link.type === "link" ? link.url : null).toBe(
      "https://youtube.com/watch?v=1",
    );
  });
});
