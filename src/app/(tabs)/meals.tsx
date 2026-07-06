import MealItem from "@/components/MealItem";
import { clearAllMeals, getMeals, Meal } from "@/storage/meals";
import { colors, globalStyles } from "@/styles/global";
import {
  formatMealDayLabel,
  groupMealsByDay,
} from "@/utils/groupMealsByDay";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AllMealsScreen() {
  const { t, i18n } = useTranslation();
  const [meals, setMeals] = useState<Meal[]>([]);

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  const handleClearAll = async () => {
    await clearAllMeals();
    loadMeals();
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
    }, []),
  );

  const sections = useMemo(() => {
    const dayLabels = {
      today: t("allMeals.today"),
      yesterday: t("allMeals.yesterday"),
    };

    return groupMealsByDay(meals).map((section) => ({
      dateKey: section.dateKey,
      title: formatMealDayLabel(section.dateKey, i18n.language, dayLabels),
      data: section.meals,
    }));
  }, [meals, i18n.language, t]);

  return (
    <SectionList
      style={globalStyles.container}
      sections={sections}
      keyExtractor={(meal) => meal.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={globalStyles.header}>
          <Text style={globalStyles.title}>{t("allMeals.title")}</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearButton}>{t("allMeals.clearAll")}</Text>
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <Text style={[globalStyles.empty, styles.empty]}>{t("allMeals.noMeals")}</Text>
      }
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.data.length}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <MealItem
          id={item.id}
          name={item.name}
          calories={item.calories}
          protein={item.protein}
          carbs={item.carbs}
          fat={item.fat}
          photoUri={item.photoUri}
          onDelete={loadMeals}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  clearButton: {
    color: colors.alert,
    fontSize: 16,
    fontWeight: "600",
  },
  empty: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "capitalize",
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
});