export type MealAnalysis = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function parseAnalysis(text: string): MealAnalysis {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<MealAnalysis>;

  if (!parsed.name || typeof parsed.name !== "string") {
    throw new Error("Invalid meal name in AI response");
  }

  return {
    name: parsed.name.trim().slice(0, 120),
    calories: Math.max(0, Math.min(10000, Math.round(Number(parsed.calories) || 0))),
    protein: Math.max(0, Math.min(1000, Math.round(Number(parsed.protein) || 0))),
    carbs: Math.max(0, Math.min(1000, Math.round(Number(parsed.carbs) || 0))),
    fat: Math.max(0, Math.min(1000, Math.round(Number(parsed.fat) || 0))),
  };
}