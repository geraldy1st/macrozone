import type { Meal } from "@/storage/meals";
import { mealToSharePayload } from "@/utils/shareMealPayload";

describe("mealToSharePayload", () => {
  it("maps a meal to community share fields", () => {
    const meal: Meal = {
      id: "1",
      name: "Bowl",
      calories: 400,
      protein: 30,
      carbs: 40,
      fat: 12,
      createdAt: "2026-01-01T00:00:00.000Z",
      description: "Tasty",
      recipe: "Mix all",
      photoUri: "file://photo.jpg",
    };

    expect(mealToSharePayload(meal)).toEqual({
      mealName: "Bowl",
      calories: 400,
      protein: 30,
      carbs: 40,
      fat: 12,
      description: "Tasty",
      recipe: "Mix all",
      localImageUri: "file://photo.jpg",
    });
  });

  it("prefers structured recipe text when present", () => {
    const meal: Meal = {
      id: "2",
      name: "Pasta",
      calories: 500,
      protein: 20,
      carbs: 60,
      fat: 15,
      createdAt: "2026-01-01T00:00:00.000Z",
      recipe: "legacy",
      recipeData: {
        servings: 2,
        calorieScope: "per_serving",
        ingredients: [{ id: "i1", name: "Pasta", quantity: "200", unit: "g" }],
        steps: [],
        notes: "Al dente",
      },
    };

    const payload = mealToSharePayload(meal);
    expect(payload.recipe).toContain("Pasta");
    expect(payload.recipe).toContain("Al dente");
  });
});
