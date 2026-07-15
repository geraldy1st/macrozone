import { analyzeRecipeText } from "@/utils/analyzeRecipe";

jest.mock("@/constants/api", () => ({
  ANALYZE_RECIPE_API_URL: "https://test.api/analyze-recipe",
}));

const ACCESS_TOKEN = "test-access-token";
const VALID_RECIPE =
  "200g chicken breast, 150g rice, 1 tbsp olive oil. Grill chicken and serve with rice.";

describe("analyzeRecipeText", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("requires an access token", async () => {
    await expect(analyzeRecipeText(VALID_RECIPE, "fr")).rejects.toMatchObject({
      code: "AUTH_REQUIRED",
    });
  });

  it("maps 401 to UNAUTHORIZED", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ status: 401 });

    await expect(
      analyzeRecipeText(VALID_RECIPE, "fr", ACCESS_TOKEN),
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("maps generic failures to ANALYSIS_FAILED", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    await expect(
      analyzeRecipeText(VALID_RECIPE, "en", ACCESS_TOKEN),
    ).rejects.toMatchObject({
      code: "ANALYSIS_FAILED",
    });
  });

  it("returns parsed recipe analysis on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        calories: 520,
        protein: 42,
        carbs: 48,
        fat: 12,
        recipe: "200g chicken\n150g rice\n1 tbsp olive oil",
      }),
    });

    await expect(
      analyzeRecipeText(VALID_RECIPE, "en", ACCESS_TOKEN, "Chicken bowl"),
    ).resolves.toEqual({
      calories: 520,
      protein: 42,
      carbs: 48,
      fat: 12,
      recipe: "200g chicken\n150g rice\n1 tbsp olive oil",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://test.api/analyze-recipe",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        }),
        body: JSON.stringify({
          recipe: VALID_RECIPE,
          language: "en",
          mealName: "Chicken bowl",
        }),
      }),
    );
  });
});