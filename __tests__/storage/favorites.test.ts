import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getFavoriteIds,
  isFavorite,
  toggleFavorite,
} from "@/storage/favorites";

jest.mock("@/storage/scopedKey", () => ({
  scopedKey: (key: string) => key,
}));

describe("favorites storage", () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it("starts with an empty favorites list", async () => {
    await expect(getFavoriteIds()).resolves.toEqual([]);
  });

  it("toggles a meal favorite state", async () => {
    await expect(toggleFavorite("meal-1")).resolves.toBe(true);
    await expect(isFavorite("meal-1")).resolves.toBe(true);
    await expect(getFavoriteIds()).resolves.toEqual(["meal-1"]);

    await expect(toggleFavorite("meal-1")).resolves.toBe(false);
    await expect(isFavorite("meal-1")).resolves.toBe(false);
    await expect(getFavoriteIds()).resolves.toEqual([]);
  });
});