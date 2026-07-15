import { useTheme } from "@/contexts/ThemeContext";
import type { Meal } from "@/storage/meals";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

type RecipeAttributionProps = {
  recipeSource?: Meal["recipeSource"];
  recipeAuthorName?: string;
};

export default function RecipeAttribution({
  recipeSource,
  recipeAuthorName,
}: RecipeAttributionProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  if (!recipeSource) {
    return null;
  }

  const label =
    recipeSource === "ai"
      ? t("mealDetail.recipeByAi")
      : t("mealDetail.recipeByUser", {
          name: recipeAuthorName?.trim() || t("mealDetail.recipeByUserFallback"),
        });

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Ionicons
        name={recipeSource === "ai" ? "sparkles" : "person-outline"}
        size={14}
        color={colors.accent}
      />
      <Text style={[styles.text, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginTop: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});