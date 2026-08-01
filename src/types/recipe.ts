export type CalorieScope = "per_serving" | "whole_dish";

export type RecipeIngredient = {
  id: string;
  name: string;
  quantity: string;
  unit: string;
};

export type RecipeData = {
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings: number;
  calorieScope: CalorieScope;
  ingredients: RecipeIngredient[];
  steps: string[];
  /** Free-text notes or legacy plain recipe. */
  notes?: string;
};

export function createIngredientId(): string {
  return `ing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyRecipeData(): RecipeData {
  return {
    servings: 1,
    calorieScope: "per_serving",
    ingredients: [],
    steps: [],
  };
}

export function createEmptyIngredient(): RecipeIngredient {
  return {
    id: createIngredientId(),
    name: "",
    quantity: "",
    unit: "",
  };
}

export function recipeDataFromLegacy(recipe?: string | null): RecipeData {
  const notes = recipe?.trim() ?? "";
  return {
    ...emptyRecipeData(),
    notes: notes || undefined,
  };
}

export function hasRecipeContent(
  data?: RecipeData | null,
  legacyRecipe?: string | null,
): boolean {
  if (legacyRecipe?.trim()) {
    return true;
  }
  if (!data) {
    return false;
  }
  if (data.notes?.trim()) {
    return true;
  }
  if ((data.prepTimeMinutes ?? 0) > 0 || (data.cookTimeMinutes ?? 0) > 0) {
    return true;
  }
  if (data.ingredients.some((i) => i.name.trim() || i.quantity.trim())) {
    return true;
  }
  if (data.steps.some((s) => s.trim())) {
    return true;
  }
  return false;
}

/** Flatten structured recipe for AI analysis / community excerpt. */
export function formatRecipeDataAsText(data: RecipeData): string {
  const lines: string[] = [];

  if (data.prepTimeMinutes != null && data.prepTimeMinutes > 0) {
    lines.push(`Prep: ${data.prepTimeMinutes} min`);
  }
  if (data.cookTimeMinutes != null && data.cookTimeMinutes > 0) {
    lines.push(`Cook: ${data.cookTimeMinutes} min`);
  }
  if (data.servings > 0) {
    lines.push(`Servings: ${data.servings}`);
  }
  lines.push(
    data.calorieScope === "whole_dish"
      ? "Macros: whole dish"
      : "Macros: per serving",
  );

  const ingredients = data.ingredients.filter(
    (i) => i.name.trim() || i.quantity.trim(),
  );
  if (ingredients.length > 0) {
    lines.push("", "Ingredients:");
    for (const item of ingredients) {
      const qty = [item.quantity.trim(), item.unit.trim()]
        .filter(Boolean)
        .join(" ");
      const name = item.name.trim() || "—";
      lines.push(qty ? `- ${qty} ${name}` : `- ${name}`);
    }
  }

  const steps = data.steps.map((s) => s.trim()).filter(Boolean);
  if (steps.length > 0) {
    lines.push("", "Steps:");
    steps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
  }

  if (data.notes?.trim()) {
    lines.push("", data.notes.trim());
  }

  return lines.join("\n").trim();
}

/**
 * Calories displayed per person when macros are for the whole dish.
 * Returns null when not applicable.
 */
export function caloriesPerServingDisplay(
  mealCalories: number,
  data?: RecipeData | null,
): number | null {
  if (!data || data.calorieScope !== "whole_dish") {
    return null;
  }
  const servings = Math.max(1, data.servings || 1);
  if (servings <= 1) {
    return null;
  }
  return Math.round(mealCalories / servings);
}

/** Normalize partial / loaded JSON into a valid RecipeData. */
export function normalizeRecipeData(
  raw?: Partial<RecipeData> | null,
): RecipeData {
  const base = emptyRecipeData();
  if (!raw || typeof raw !== "object") {
    return base;
  }

  const ingredients = Array.isArray(raw.ingredients)
    ? raw.ingredients.map((item, index) => ({
        id:
          typeof item?.id === "string" && item.id
            ? item.id
            : `ing-migrated-${index}`,
        name: typeof item?.name === "string" ? item.name : "",
        quantity: typeof item?.quantity === "string" ? item.quantity : "",
        unit: typeof item?.unit === "string" ? item.unit : "",
      }))
    : [];

  const steps = Array.isArray(raw.steps)
    ? raw.steps.filter((s): s is string => typeof s === "string")
    : [];

  return {
    prepTimeMinutes:
      typeof raw.prepTimeMinutes === "number" && raw.prepTimeMinutes >= 0
        ? Math.round(raw.prepTimeMinutes)
        : undefined,
    cookTimeMinutes:
      typeof raw.cookTimeMinutes === "number" && raw.cookTimeMinutes >= 0
        ? Math.round(raw.cookTimeMinutes)
        : undefined,
    servings:
      typeof raw.servings === "number" && raw.servings > 0
        ? Math.round(raw.servings)
        : 1,
    calorieScope:
      raw.calorieScope === "whole_dish" ? "whole_dish" : "per_serving",
    ingredients,
    steps,
    notes: typeof raw.notes === "string" ? raw.notes : undefined,
  };
}
