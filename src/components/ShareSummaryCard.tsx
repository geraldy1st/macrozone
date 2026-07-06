import AppLogo from "@/components/AppLogo";
import type { MacroGoals } from "@/storage/goals";
import type { Meal } from "@/storage/meals";
import { colors, macroColors } from "@/styles/global";
import { calculateMacroTotals } from "@/utils/groupMealsByDay";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View, type View as ViewType } from "react-native";

type ShareSummaryCardProps = {
  meals: Meal[];
  goals: MacroGoals;
  dateLabel: string;
};

type MacroStatProps = {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
};

function MacroStat({ label, value, goal, color, unit = "" }: MacroStatProps) {
  const progress = goal > 0 ? Math.min(value / goal, 1) : 0;

  return (
    <View style={styles.macroStat}>
      <View style={styles.macroStatHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={[styles.macroValue, { color }]}>
          {value.toLocaleString()}
          {unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const ShareSummaryCard = forwardRef<ViewType, ShareSummaryCardProps>(
  function ShareSummaryCard({ meals, goals, dateLabel }, ref) {
    const { t } = useTranslation();
    const totals = calculateMacroTotals(meals);

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <View style={styles.header}>
          <AppLogo size={48} />
          <View style={styles.headerText}>
            <Text style={styles.appName}>{t("app.name")}</Text>
            <Text style={styles.dateLabel}>{dateLabel}</Text>
          </View>
        </View>

        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>{t("share.mealsTitle")}</Text>
          {meals.map((meal, index) => (
            <View
              key={meal.id}
              style={[
                styles.mealRow,
                index < meals.length - 1 && styles.mealRowBorder,
              ]}
            >
              <Text style={styles.mealName} numberOfLines={1}>
                {meal.name}
              </Text>
              <Text style={styles.mealMacros}>
                {t("macros.mealMacros", {
                  calories: meal.calories,
                  protein: meal.protein,
                  carbs: meal.carbs,
                  fat: meal.fat,
                })}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsSection}>
          <Text style={styles.sectionTitle}>{t("share.dailyTotal")}</Text>
          <MacroStat
            label={t("macros.calories")}
            value={totals.calories}
            goal={goals.calories}
            color={macroColors.calories}
          />
          <View style={styles.macroRow}>
            <MacroStat
              label={t("macros.protein")}
              value={totals.protein}
              goal={goals.protein}
              color={macroColors.protein}
              unit="g"
            />
            <MacroStat
              label={t("macros.carbs")}
              value={totals.carbs}
              goal={goals.carbs}
              color={macroColors.carbs}
              unit="g"
            />
            <MacroStat
              label={t("macros.fat")}
              value={totals.fat}
              goal={goals.fat}
              color={macroColors.fat}
              unit="g"
            />
          </View>
        </View>

        <Text style={styles.footer}>{t("share.footer")}</Text>
      </View>
    );
  },
);

export default ShareSummaryCard;

const styles = StyleSheet.create({
  card: {
    width: 380,
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  appName: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "capitalize",
  },
  mealsSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: macroColors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  mealRow: {
    paddingVertical: 10,
  },
  mealRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  mealMacros: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalsSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  macroStat: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  macroStatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  macroRow: {
    flexDirection: "row",
    gap: 10,
  },
  footer: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
  },
});