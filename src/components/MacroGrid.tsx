import { getMacroGoals, MacroGoals } from "@/storage/goals";
import { Meal } from "@/storage/meals";
import { macroColors } from "@/styles/global";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";
import MacroCard from "./MacroCard";

type MacroGridProps = {
  meals: Meal[];
};

export default function MacroGrid({ meals }: MacroGridProps) {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<MacroGoals | null>(null);

  useFocusEffect(
    useCallback(() => {
      getMacroGoals().then(setGoals);
    }, []),
  );

  const totals = meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.calories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  if (!goals) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t("home.dailyProgress")}</Text>

      <MacroCard
        label={t("macros.calories")}
        current={totals.calories}
        goal={goals.calories}
        color={macroColors.calories}
        variant="hero"
      />

      <View style={styles.row}>
        <MacroCard
          label={t("macros.protein")}
          current={totals.protein}
          goal={goals.protein}
          color={macroColors.protein}
          unit="g"
        />
        <MacroCard
          label={t("macros.carbs")}
          current={totals.carbs}
          goal={goals.carbs}
          color={macroColors.carbs}
          unit="g"
        />
        <MacroCard
          label={t("macros.fat")}
          current={totals.fat}
          goal={goals.fat}
          color={macroColors.fat}
          unit="g"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: macroColors.accent,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
});