import AppLogo from "@/components/AppLogo";
import type { Meal } from "@/storage/meals";
import { macroColors } from "@/styles/themes";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import { Image, StyleSheet, Text, View, type View as ViewType } from "react-native";

type MealShareCardProps = {
  meal: Meal;
};

const MealShareCard = forwardRef<ViewType, MealShareCardProps>(
  function MealShareCard({ meal }, ref) {
    const { t } = useTranslation();

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <View style={styles.header}>
          <AppLogo size={40} />
          <Text style={styles.appName}>{t("app.name")}</Text>
        </View>

        {meal.photoUri ? (
          <Image source={{ uri: meal.photoUri }} style={styles.photo} />
        ) : null}

        <Text style={styles.name}>{meal.name}</Text>
        <Text style={styles.macros}>
          {t("macros.mealMacros", {
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
          })}
        </Text>

        {meal.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("mealDetail.description")}</Text>
            <Text style={styles.sectionBody}>{meal.description}</Text>
          </View>
        ) : null}

        {meal.recipe ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t("mealDetail.recipe")}</Text>
            <Text style={styles.sectionBody}>{meal.recipe}</Text>
          </View>
        ) : null}

        <Text style={styles.footer}>{t("share.footer")}</Text>
      </View>
    );
  },
);

export default MealShareCard;

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: "#16162a",
    borderRadius: 20,
    padding: 24,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  appName: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  photo: {
    width: "100%",
    height: 180,
    borderRadius: 14,
  },
  name: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },
  macros: {
    color: macroColors.protein,
    fontSize: 14,
    fontWeight: "600",
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    color: macroColors.accent,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionBody: {
    color: "#d8deea",
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    color: "#8b8ba0",
    fontSize: 12,
    marginTop: 8,
  },
});