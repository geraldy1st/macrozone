import {
  caloriesPerServingDisplay,
  emptyRecipeData,
  formatRecipeDataAsText,
  hasRecipeContent,
  normalizeRecipeData,
  recipeDataFromLegacy,
} from "@/types/recipe";

describe("recipe helpers", () => {
  it("detects content from structured fields and legacy text", () => {
    expect(hasRecipeContent(emptyRecipeData())).toBe(false);
    expect(hasRecipeContent(undefined, "  pasta  ")).toBe(true);
    expect(
      hasRecipeContent({
        ...emptyRecipeData(),
        ingredients: [
          { id: "1", name: "Rice", quantity: "100", unit: "g" },
        ],
      }),
    ).toBe(true);
  });

  it("formats structured recipe for AI / community", () => {
    const text = formatRecipeDataAsText({
      prepTimeMinutes: 10,
      cookTimeMinutes: 20,
      servings: 2,
      calorieScope: "whole_dish",
      ingredients: [
        { id: "1", name: "Eggs", quantity: "2", unit: "" },
        { id: "2", name: "Salt", quantity: "", unit: "" },
      ],
      steps: ["Mix", "Cook"],
      notes: "Serve hot",
    });

    expect(text).toContain("Prep: 10 min");
    expect(text).toContain("Servings: 2");
    expect(text).toContain("Macros: whole dish");
    expect(text).toContain("- 2 Eggs");
    expect(text).toContain("1. Mix");
    expect(text).toContain("Serve hot");
  });

  it("computes approx calories per serving for whole dish", () => {
    expect(
      caloriesPerServingDisplay(600, {
        ...emptyRecipeData(),
        servings: 3,
        calorieScope: "whole_dish",
      }),
    ).toBe(200);
    expect(
      caloriesPerServingDisplay(600, {
        ...emptyRecipeData(),
        servings: 2,
        calorieScope: "per_serving",
      }),
    ).toBeNull();
  });

  it("migrates legacy free-text into notes", () => {
    const data = recipeDataFromLegacy("Boil water");
    expect(data.notes).toBe("Boil water");
    expect(normalizeRecipeData({ servings: 0, ingredients: null as never }).servings).toBe(
      1,
    );
  });
});
