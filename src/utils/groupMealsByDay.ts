import type { Meal } from "@/storage/meals";

export type MealDaySection = {
  dateKey: string;
  meals: Meal[];
};

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function calculateMacroTotals(meals: Meal[]): MacroTotals {
  return meals.reduce(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      protein: totals.protein + meal.protein,
      carbs: totals.carbs + meal.carbs,
      fat: totals.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export function filterMealsForToday(
  meals: Meal[],
  referenceDate = new Date(),
): Meal[] {
  const todayKey = formatDateKey(referenceDate);

  return meals
    .filter((meal) => getLocalDateKey(meal.createdAt) === todayKey)
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );
}

export function getLocalDateKey(isoDate: string): string {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  return formatDateKey(new Date(year, month, day));
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function groupMealsByDay(meals: Meal[]): MealDaySection[] {
  const grouped = new Map<string, Meal[]>();

  for (const meal of meals) {
    const dateKey = getLocalDateKey(meal.createdAt);
    const dayMeals = grouped.get(dateKey);

    if (dayMeals) {
      dayMeals.push(meal);
    } else {
      grouped.set(dateKey, [meal]);
    }
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([dateKey, dayMeals]) => ({
      dateKey,
      meals: dayMeals.sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    }));
}

export function formatMealDayLabel(
  dateKey: string,
  language: string,
  labels: { today: string; yesterday: string },
  referenceDate = new Date(),
): string {
  const todayKey = formatDateKey(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  if (dateKey === todayKey) {
    return labels.today;
  }

  if (dateKey === yesterdayKey) {
    return labels.yesterday;
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const locale = language === "fr" ? "fr-FR" : "en-US";
  const date = new Date(year, month - 1, day);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };

  if (year !== referenceDate.getFullYear()) {
    options.year = "numeric";
  }

  return new Intl.DateTimeFormat(locale, options).format(date);
}