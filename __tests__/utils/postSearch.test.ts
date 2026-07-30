import {
  buildPostSearchOrFilter,
  sanitizePostSearchTerm,
} from "@/utils/postSearch";

describe("postSearch", () => {
  it("sanitizes characters that break PostgREST or-filters", () => {
    expect(sanitizePostSearchTerm("  pasta, carbonara%  ")).toBe("pasta carbonara");
    expect(sanitizePostSearchTerm('chicken_(grilled)"')).toBe("chicken grilled");
  });

  it("returns null filter for empty/whitespace queries", () => {
    expect(buildPostSearchOrFilter("")).toBeNull();
    expect(buildPostSearchOrFilter("   ")).toBeNull();
    expect(buildPostSearchOrFilter("%%%")).toBeNull();
  });

  it("builds meal_name and caption ilike filter", () => {
    expect(buildPostSearchOrFilter("salmon")).toBe(
      "meal_name.ilike.%salmon%,caption.ilike.%salmon%",
    );
    expect(buildPostSearchOrFilter("  rice bowl ")).toBe(
      "meal_name.ilike.%rice bowl%,caption.ilike.%rice bowl%",
    );
  });
});
