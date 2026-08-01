import {
  COMMUNITY_FEED_PAGE_SIZE,
  MAX_CAPTION_LENGTH,
  MAX_COMMENT_LENGTH,
  MEAL_POSTS_BUCKET,
  ONLINE_THRESHOLD_MS,
  PROFILE_SEARCH_PAGE_SIZE,
} from "@/types/community";

describe("community constants", () => {
  it("exports stable MVP limits", () => {
    expect(COMMUNITY_FEED_PAGE_SIZE).toBe(20);
    expect(MAX_CAPTION_LENGTH).toBe(280);
    expect(MAX_COMMENT_LENGTH).toBe(500);
    expect(MEAL_POSTS_BUCKET).toBe("meal-posts");
    expect(PROFILE_SEARCH_PAGE_SIZE).toBe(20);
    expect(ONLINE_THRESHOLD_MS).toBe(5 * 60 * 1000);
  });
});
