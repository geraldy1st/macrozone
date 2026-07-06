import AsyncStorage from "@react-native-async-storage/async-storage";
import { addMeal, deleteMeal, getMeals } from "@/storage/meals";
import { setStorageScope } from "@/storage/scopedKey";

jest.mock("@/utils/photos", () => ({
  saveMealPhoto: jest.fn(async () => "file://meal-photos/1.jpg"),
  deleteMealPhoto: jest.fn(async () => undefined),
  clearAllMealPhotos: jest.fn(async () => undefined),
}));

describe("meals storage", () => {
  beforeEach(async () => {
    setStorageScope("test-user");
    await AsyncStorage.clear();
  });

  it("starts with an empty meal list", async () => {
    await expect(getMeals()).resolves.toEqual([]);
  });

  it("adds a meal without photo", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const meal = await addMeal({
      name: "Salade",
      calories: 320,
      protein: 12,
      carbs: 18,
      fat: 9,
    });

    expect(meal).toMatchObject({
      id: "1700000000000",
      name: "Salade",
      calories: 320,
      photoUri: undefined,
    });

    const meals = await getMeals();
    expect(meals).toHaveLength(1);
    expect(meals[0]?.name).toBe("Salade");
  });

  it("prepends newer meals first", async () => {
    const nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(1_700_000_000_001)
      .mockReturnValueOnce(1_700_000_000_002);

    await addMeal({
      name: "Déjeuner",
      calories: 500,
      protein: 20,
      carbs: 40,
      fat: 15,
    });

    await addMeal({
      name: "Dîner",
      calories: 650,
      protein: 30,
      carbs: 50,
      fat: 20,
    });

    const meals = await getMeals();
    expect(meals.map((meal) => meal.name)).toEqual(["Dîner", "Déjeuner"]);
    nowSpy.mockRestore();
  });

  it("stores a photo URI when provided", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_003);
    const meal = await addMeal(
      {
        name: "Pâtes",
        calories: 450,
        protein: 15,
        carbs: 60,
        fat: 12,
      },
      "file://cache/photo.jpg",
    );

    expect(meal.photoUri).toBe("file://meal-photos/1.jpg");
  });

  it("deletes a meal by id", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_004);

    const meal = await addMeal({
      name: "Soupe",
      calories: 180,
      protein: 8,
      carbs: 20,
      fat: 5,
    });

    await deleteMeal(meal.id);
    await expect(getMeals()).resolves.toEqual([]);
  });
});