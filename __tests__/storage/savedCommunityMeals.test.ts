import {
  feedPostToSavedMeal,
  getSavedCommunityMeals,
  isCommunityMealSaved,
  toggleSavedCommunityMeal,
} from "@/storage/savedCommunityMeals";
import type { FeedPost } from "@/types/community";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const samplePost: FeedPost = {
  id: "post-1",
  author_id: "user-1",
  meal_name: "Salad",
  caption: "Yum",
  calories: 300,
  protein: 20,
  carbs: 10,
  fat: 12,
  image_path: null,
  description: "Fresh",
  recipe_excerpt: "Mix",
  likes_count: 0,
  comments_count: 0,
  created_at: "2026-07-29T10:00:00.000Z",
  deleted_at: null,
  author: { id: "user-1", display_name: "Alex", avatar_url: null },
  image_url: "https://example.com/a.jpg",
};

describe("savedCommunityMeals", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("toggles save state", async () => {
    expect(await isCommunityMealSaved("post-1")).toBe(false);

    await expect(toggleSavedCommunityMeal(samplePost)).resolves.toBe(true);
    expect(await isCommunityMealSaved("post-1")).toBe(true);

    const saved = await getSavedCommunityMeals();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.name).toBe("Salad");

    await expect(toggleSavedCommunityMeal(samplePost)).resolves.toBe(false);
    expect(await isCommunityMealSaved("post-1")).toBe(false);
  });

  it("maps feed post fields", () => {
    expect(feedPostToSavedMeal(samplePost)).toMatchObject({
      id: "post-1",
      name: "Salad",
      authorName: "Alex",
      imageUrl: "https://example.com/a.jpg",
    });
  });
});
