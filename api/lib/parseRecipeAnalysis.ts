export type RecipeAnalysis = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipe: string;
};

function clampMacro(value: unknown, max = 10000) {
  return Math.max(0, Math.min(max, Math.round(Number(value) || 0)));
}

export function parseRecipeAnalysis(text: string): RecipeAnalysis {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<RecipeAnalysis>;

  if (!parsed.recipe || typeof parsed.recipe !== "string") {
    throw new Error("Invalid recipe in AI response");
  }

  return {
    calories: clampMacro(parsed.calories),
    protein: clampMacro(parsed.protein, 1000),
    carbs: clampMacro(parsed.carbs, 1000),
    fat: clampMacro(parsed.fat, 1000),
    recipe: parsed.recipe.trim().slice(0, 4000),
  };
}