import AsyncStorage from "@react-native-async-storage/async-storage";
import { addMeal, type Meal } from "@/storage/meals";
import { setStorageScope } from "@/storage/scopedKey";
import {
  addFavoriteMealForToday,
  checkFavoriteDuplicateToday,
  isMealAlreadyLoggedToday,
} from "@/utils/addMealFromFavorite";

jest.mock("@/utils/photos", () => ({
  saveMealPhoto: jest.fn(async () => "file://meal-photos/copied.jpg"),
  deleteMealPhoto: jest.fn(async () => undefined),
  clearAllMealPhotos: jest.fn(async () => undefined),
}));

const templateMeal: Meal = {
  id: "favorite-1",
  name: "Poulet riz",
  calories: 520,
  protein: 40,
  carbs: 55,
  fat: 12,
  createdAt: new Date().toISOString(),
  description: "Repas équilibré",
  recipe: "Cuire le riz",
  photoUri: "file://meal-photos/favorite-1.jpg",
};

describe("addMealFromFavorite", () => {
  beforeEach(async () => {
    setStorageScope("test-user");
    await AsyncStorage.clear();
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_100);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("detects when a template meal is already logged today", async () => {
    await addMeal(
      {
        name: templateMeal.name,
        calories: templateMeal.calories,
        protein: templateMeal.protein,
        carbs: templateMeal.carbs,
        fat: templateMeal.fat,
        templateId: templateMeal.id,
      },
      undefined,
    );

    const meals = await AsyncStorage.getItem("meals:test-user");
    const parsed = meals ? JSON.parse(meals) : [];

    expect(
      isMealAlreadyLoggedToday(parsed, templateMeal.id),
    ).toBe(true);
    expect(await checkFavoriteDuplicateToday(templateMeal.id)).toBe(true);
  });

  it("adds a favorite meal copy for today with templateId", async () => {
    const added = await addFavoriteMealForToday(templateMeal);

    expect(added).toMatchObject({
      name: templateMeal.name,
      templateId: templateMeal.id,
      description: templateMeal.description,
      recipe: templateMeal.recipe,
      photoUri: "file://meal-photos/copied.jpg",
    });
    expect(await checkFavoriteDuplicateToday(templateMeal.id)).toBe(true);
  });
});