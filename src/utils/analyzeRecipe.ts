import { ANALYZE_RECIPE_API_URL } from "@/constants/api";
import type { AnalyzeMealErrorCode } from "@/utils/analyzeMeal";
import { AnalyzeMealError } from "@/utils/analyzeMeal";

export type RecipeAnalysis = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe: string;
};

export async function analyzeRecipeText(
  recipe: string,
  language: "en" | "fr",
  accessToken: string,
  mealName?: string,
): Promise<RecipeAnalysis> {
  if (!ANALYZE_RECIPE_API_URL) {
    throw new AnalyzeMealError("API_NOT_CONFIGURED");
  }

  if (!accessToken) {
    throw new AnalyzeMealError("AUTH_REQUIRED");
  }

  const response = await fetch(ANALYZE_RECIPE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      recipe,
      language,
      mealName,
    }),
  });

  if (response.status === 401) {
    throw new AnalyzeMealError("UNAUTHORIZED");
  }

  if (response.status === 413) {
    throw new AnalyzeMealError("IMAGE_TOO_LARGE");
  }

  if (response.status === 429) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    if (body?.error === "AI quota exceeded") {
      throw new AnalyzeMealError("AI_QUOTA_EXCEEDED");
    }

    throw new AnalyzeMealError("RATE_LIMITED");
  }

  if (!response.ok) {
    throw new AnalyzeMealError("ANALYSIS_FAILED");
  }

  return (await response.json()) as RecipeAnalysis;
}