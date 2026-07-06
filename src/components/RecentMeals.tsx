import { useThemedStyles } from "@/hooks/useThemedStyles";
import { Meal } from "@/storage/meals";
import { macroColors, type ThemeColors } from "@/styles/themes";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import MealItem from "./MealItem";

type RecentMealsProps = {
  meals: Meal[];
  onDelete: () => void;
};

export default function RecentMeals({ meals, onDelete }: RecentMealsProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>{t("home.recentMeals")}</Text>
        {meals.length > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{meals.length}</Text>
          </View>
        )}
      </View>

      {meals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.empty}>{t("home.noMeals")}</Text>
        </View>
      ) : (
        meals
          .slice(0, 5)
          .map((meal) => (
            <MealItem
              key={meal.id}
              id={meal.id}
              onDelete={onDelete}
              name={meal.name}
              calories={meal.calories}
              protein={meal.protein}
              carbs={meal.carbs}
              fat={meal.fat}
              photoUri={meal.photoUri}
            />
          ))
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: {
    marginTop: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  countBadge: {
    backgroundColor: `${macroColors.accent}22`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: macroColors.accent,
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  });
}