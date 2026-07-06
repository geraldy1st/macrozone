import {
  calculateMacroTotals,
  filterMealsForToday,
  formatDateKey,
  formatMealDayLabel,
  getLocalDateKey,
  groupMealsByDay,
} from "@/utils/groupMealsByDay";
import type { Meal } from "@/storage/meals";

function createMeal(
  id: string,
  createdAt: string,
  name = "Meal",
): Meal {
  return {
    id,
    name,
    calories: 100,
    protein: 10,
    carbs: 10,
    fat: 5,
    createdAt,
  };
}

describe("groupMealsByDay", () => {
  it("groups meals by local calendar day", () => {
    const meals = [
      createMeal("1", "2026-07-06T08:00:00.000Z", "Breakfast"),
      createMeal("2", "2026-07-06T20:00:00.000Z", "Dinner"),
      createMeal("3", "2026-07-05T12:00:00.000Z", "Lunch"),
    ];

    const sections = groupMealsByDay(meals);

    expect(sections).toHaveLength(2);
    expect(sections[0]?.dateKey).toBe(getLocalDateKey("2026-07-06T08:00:00.000Z"));
    expect(sections[0]?.meals.map((meal) => meal.id)).toEqual(["2", "1"]);
    expect(sections[1]?.meals.map((meal) => meal.id)).toEqual(["3"]);
  });

  it("sorts sections from newest day to oldest", () => {
    const meals = [
      createMeal("1", "2026-07-01T10:00:00.000Z"),
      createMeal("2", "2026-07-03T10:00:00.000Z"),
      createMeal("3", "2026-07-02T10:00:00.000Z"),
    ];

    const sections = groupMealsByDay(meals);

    expect(sections.map((section) => section.dateKey)).toEqual([
      getLocalDateKey("2026-07-03T10:00:00.000Z"),
      getLocalDateKey("2026-07-02T10:00:00.000Z"),
      getLocalDateKey("2026-07-01T10:00:00.000Z"),
    ]);
  });

  it("returns an empty list when there are no meals", () => {
    expect(groupMealsByDay([])).toEqual([]);
  });
});

describe("filterMealsForToday", () => {
  const referenceDate = new Date(2026, 6, 6, 12, 0, 0);

  it("returns only meals from the reference day", () => {
    const meals = [
      createMeal("1", "2026-07-06T08:00:00.000Z"),
      createMeal("2", "2026-07-05T12:00:00.000Z"),
      createMeal("3", "2026-07-06T19:00:00.000Z"),
    ];

    const todayMeals = filterMealsForToday(meals, referenceDate);

    expect(todayMeals.map((meal) => meal.id)).toEqual(["3", "1"]);
  });
});

describe("calculateMacroTotals", () => {
  it("sums macro values across meals", () => {
    const totals = calculateMacroTotals([
      createMeal("1", "2026-07-06T08:00:00.000Z"),
      {
        ...createMeal("2", "2026-07-06T12:00:00.000Z"),
        calories: 200,
        protein: 20,
        carbs: 30,
        fat: 10,
      },
    ]);

    expect(totals).toEqual({
      calories: 300,
      protein: 30,
      carbs: 40,
      fat: 15,
    });
  });
});

describe("formatMealDayLabel", () => {
  const labels = { today: "Today", yesterday: "Yesterday" };
  const referenceDate = new Date(2026, 6, 6, 12, 0, 0);

  it("returns the today label for the current day", () => {
    expect(
      formatMealDayLabel(
        formatDateKey(referenceDate),
        "en",
        labels,
        referenceDate,
      ),
    ).toBe("Today");
  });

  it("returns the yesterday label for the previous day", () => {
    expect(
      formatMealDayLabel("2026-07-05", "en", labels, referenceDate),
    ).toBe("Yesterday");
  });

  it("formats other days with locale-aware labels", () => {
    const english = formatMealDayLabel(
      "2026-07-01",
      "en",
      labels,
      referenceDate,
    );
    const french = formatMealDayLabel(
      "2026-07-01",
      "fr",
      { today: "Aujourd'hui", yesterday: "Hier" },
      referenceDate,
    );

    expect(english).toContain("July");
    expect(french).toContain("juillet");
  });
});