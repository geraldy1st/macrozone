import LinkifiedText from "@/components/LinkifiedText";
import type { ThemeColors } from "@/styles/themes";
import {
  caloriesPerServingDisplay,
  hasRecipeContent,
  type RecipeData,
} from "@/types/recipe";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, View } from "react-native";

type RecipeDisplayProps = {
  recipeData?: RecipeData | null;
  legacyRecipe?: string | null;
  mealCalories: number;
  colors: ThemeColors;
  emptyLabel: string;
};

export default function RecipeDisplay({
  recipeData,
  legacyRecipe,
  mealCalories,
  colors,
  emptyLabel,
}: RecipeDisplayProps) {
  const { t } = useTranslation();
  const styles = createStyles();

  if (!hasRecipeContent(recipeData, legacyRecipe)) {
    return (
      <Text style={[styles.body, { color: colors.textSecondary }]}>
        {emptyLabel}
      </Text>
    );
  }

  const data = recipeData;
  const perServing = caloriesPerServingDisplay(mealCalories, data);

  if (!data) {
    return (
      <LinkifiedText
        text={legacyRecipe?.trim() ?? ""}
        style={[styles.body, { color: colors.textSecondary }]}
        linkStyle={{ color: colors.primary }}
      />
    );
  }

  const ingredients = data.ingredients.filter(
    (i) => i.name.trim() || i.quantity.trim(),
  );
  const steps = data.steps.map((s) => s.trim()).filter(Boolean);
  const notes = data.notes?.trim() || (!ingredients.length ? legacyRecipe?.trim() : "");

  return (
    <View style={styles.wrap}>
      <View style={styles.metaRow}>
        {data.prepTimeMinutes ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {t("recipe.prepTimeValue", { minutes: data.prepTimeMinutes })}
          </Text>
        ) : null}
        {data.cookTimeMinutes ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {t("recipe.cookTimeValue", { minutes: data.cookTimeMinutes })}
          </Text>
        ) : null}
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {t("recipe.servingsValue", { count: data.servings || 1 })}
        </Text>
      </View>

      <Text style={[styles.scope, { color: colors.primary }]}>
        {data.calorieScope === "whole_dish"
          ? t("recipe.scopeWholeDish")
          : t("recipe.scopePerServing")}
        {perServing != null
          ? ` · ${t("recipe.approxPerServing", { calories: perServing })}`
          : ""}
      </Text>

      {ingredients.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>
            {t("recipe.ingredients")}
          </Text>
          {ingredients.map((item) => {
            const qty = [item.quantity.trim(), item.unit.trim()]
              .filter(Boolean)
              .join(" ");
            return (
              <Text
                key={item.id}
                style={[styles.body, { color: colors.textSecondary }]}
              >
                {qty ? `• ${qty} ${item.name.trim()}` : `• ${item.name.trim()}`}
              </Text>
            );
          })}
        </View>
      ) : null}

      {steps.length > 0 ? (
        <View style={styles.block}>
          <Text style={[styles.blockTitle, { color: colors.text }]}>
            {t("recipe.steps")}
          </Text>
          {steps.map((step, index) => (
            <Text
              key={`${index}-${step.slice(0, 12)}`}
              style={[styles.body, { color: colors.textSecondary }]}
            >
              {index + 1}. {step}
            </Text>
          ))}
        </View>
      ) : null}

      {notes ? (
        <View style={styles.block}>
          {ingredients.length > 0 || steps.length > 0 ? (
            <Text style={[styles.blockTitle, { color: colors.text }]}>
              {t("recipe.notes")}
            </Text>
          ) : null}
          <LinkifiedText
            text={notes}
            style={[styles.body, { color: colors.textSecondary }]}
            linkStyle={{ color: colors.primary }}
          />
        </View>
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      gap: 10,
    },
    metaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    meta: {
      fontSize: 13,
      fontWeight: "600",
    },
    scope: {
      fontSize: 13,
      fontWeight: "700",
    },
    block: {
      gap: 4,
    },
    blockTitle: {
      fontSize: 14,
      fontWeight: "800",
      marginBottom: 2,
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      fontWeight: "500",
    },
  });
}
