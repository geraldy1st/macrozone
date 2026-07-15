import { parseRecipeAnalysis } from "../../api/lib/parseRecipeAnalysis";

describe("parseRecipeAnalysis", () => {
  it("parses recipe analysis JSON", () => {
    const result = parseRecipeAnalysis(
      JSON.stringify({
        calories: 520,
        protein: 35,
        carbs: 48,
        fat: 18,
        recipe: "200g poulet\n150g riz",
      }),
    );

    expect(result).toEqual({
      calories: 520,
      protein: 35,
      carbs: 48,
      fat: 18,
      recipe: "200g poulet\n150g riz",
    });
  });
});