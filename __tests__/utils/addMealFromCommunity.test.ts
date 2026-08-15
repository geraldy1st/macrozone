import AsyncStorage from "@react-native-async-storage/async-storage";
import { setStorageScope } from "@/storage/scopedKey";
import type { FeedPost } from "@/types/community";
import {
  addCommunityMealForToday,
  checkCommunityDuplicateToday,
  communityTemplateId,
} from "@/utils/addMealFromCommunity";

jest.mock("@/utils/photos", () => ({
  saveMealPhoto: jest.fn(async () => "file://meal-photos/copied.jpg"),
  deleteMealPhoto: jest.fn(async () => undefined),
  clearAllMealPhotos: jest.fn(async () => undefined),
}));

const post: FeedPost = {
  id: "post-42",
  author_id: "user-9",
  meal_name: "Bowl saumon",
  caption: "Simple",
  calories: 520,
  protein: 38,
  carbs: 45,
  fat: 18,
  image_path: null,
  description: "Quinoa + saumon",
  recipe_excerpt: "Griller le saumon",
  likes_count: 12,
  comments_count: 0,
  created_at: new Date().toISOString(),
  deleted_at: null,
  author: { id: "user-9", display_name: "Hinata", avatar_url: null },
  image_url: "https://cdn.example.com/bowl.jpg",
};

describe("addMealFromCommunity", () => {
  beforeEach(async () => {
    setStorageScope("test-user");
    await AsyncStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_200);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses a stable community template id", () => {
    expect(communityTemplateId("post-42")).toBe("community:post-42");
  });

  it("logs a catalog meal for today with attribution", async () => {
    const added = await addCommunityMealForToday(post);

    expect(added).toMatchObject({
      name: "Bowl saumon",
      calories: 520,
      templateId: "community:post-42",
      description: "Quinoa + saumon",
      recipe: "Griller le saumon",
      recipeAuthorName: "Hinata",
      photoUri: "file://meal-photos/copied.jpg",
    });
    expect(await checkCommunityDuplicateToday("post-42")).toBe(true);
  });

  it("still logs the meal if the remote photo cannot be copied", async () => {
    const { saveMealPhoto } = jest.requireMock("@/utils/photos") as {
      saveMealPhoto: jest.Mock;
    };
    saveMealPhoto.mockRejectedValueOnce(new Error("remote copy failed"));

    const added = await addCommunityMealForToday(post);

    expect(added.name).toBe("Bowl saumon");
    expect(added.templateId).toBe("community:post-42");
    expect(added.photoUri).toBeUndefined();
  });
});
