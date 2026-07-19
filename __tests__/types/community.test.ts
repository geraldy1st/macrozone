import {
  COMMUNITY_FEED_PAGE_SIZE,
  MAX_CAPTION_LENGTH,
  MAX_COMMENT_LENGTH,
  MEAL_POSTS_BUCKET,
} from "@/types/community";

describe("community constants", () => {
  it("exports stable MVP limits", () => {
    expect(COMMUNITY_FEED_PAGE_SIZE).toBe(20);
    expect(MAX_CAPTION_LENGTH).toBe(280);
    expect(MAX_COMMENT_LENGTH).toBe(500);
    expect(MEAL_POSTS_BUCKET).toBe("meal-posts");
  });
});
