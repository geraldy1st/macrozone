import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addMeal,
  deleteMeal,
  deleteMeals,
  getMealById,
  getMeals,
  updateMeal,
} from "@/storage/meals";
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

  it("gets a meal by id", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_005);

    const meal = await addMeal({
      name: "Wrap",
      calories: 410,
      protein: 22,
      carbs: 35,
      fat: 18,
      description: "Déjeuner rapide",
    });

    await expect(getMealById(meal.id)).resolves.toMatchObject({
      name: "Wrap",
      description: "Déjeuner rapide",
    });
    await expect(getMealById("missing")).resolves.toBeNull();
  });

  it("updates a meal", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1_700_000_000_006);

    const meal = await addMeal({
      name: "Omelette",
      calories: 280,
      protein: 18,
      carbs: 2,
      fat: 20,
    });

    const updated = await updateMeal(meal.id, {
      name: "Omelette aux herbes",
      recipe: "Battre les œufs",
    });

    expect(updated).toMatchObject({
      id: meal.id,
      name: "Omelette aux herbes",
      recipe: "Battre les œufs",
    });
  });

  it("deletes multiple meals by id", async () => {
    jest.spyOn(Date, "now").mockReturnValueOnce(1_700_000_000_007).mockReturnValueOnce(1_700_000_000_008);

    const first = await addMeal({
      name: "Snack 1",
      calories: 120,
      protein: 4,
      carbs: 18,
      fat: 3,
    });

    const second = await addMeal({
      name: "Snack 2",
      calories: 150,
      protein: 5,
      carbs: 20,
      fat: 4,
    });

    await deleteMeals([first.id, second.id]);
    await expect(getMeals()).resolves.toEqual([]);
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