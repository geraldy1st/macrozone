import MealItem from "@/components/MealItem";
import { clearAllMeals, getMeals, Meal } from "@/storage/meals";
import { getFavoriteIds } from "@/storage/favorites";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { globalStyles } from "@/styles/global";
import type { ThemeColors } from "@/styles/themes";
import {
  formatMealDayLabel,
  groupMealsByDay,
} from "@/utils/groupMealsByDay";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const loadMeals = async () => {
    const [data, ids] = await Promise.all([getMeals(), getFavoriteIds()]);
    setMeals(data);
    setFavoriteIds(ids);
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
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      sections={sections}
      keyExtractor={(meal) => meal.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View>
          <View style={globalStyles.header}>
            <Text style={[globalStyles.title, { color: colors.text }]}>
              {t("allMeals.title")}
            </Text>
            <TouchableOpacity onPress={handleClearAll}>
              <Text style={styles.clearButton}>{t("allMeals.clearAll")}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.favoritesButton,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() => router.push("/favorite-meals")}
            testID="open-favorites-btn"
          >
            <Ionicons name="star" size={18} color={colors.accent} />
            <Text style={[styles.favoritesButtonText, { color: colors.text }]}>
              {t("allMeals.favoritesButton")}
            </Text>
            {favoriteIds.length > 0 && (
              <View style={[styles.favoritesCount, { backgroundColor: colors.surface }]}>
                <Text style={[styles.favoritesCountText, { color: colors.accent }]}>
                  {favoriteIds.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      }
      ListEmptyComponent={
        <Text
          style={[globalStyles.empty, styles.empty, { color: colors.textSecondary }]}
        >
          {t("allMeals.noMeals")}
        </Text>
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
          isFavorite={favoriteIds.includes(item.id)}
          enableFavorite
          onToggleFavorite={loadMeals}
          onDelete={loadMeals}
        />
      )}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      paddingBottom: 40,
      flexGrow: 1,
    },
    favoritesButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
    },
    favoritesButtonText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
    },
    favoritesCount: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 8,
    },
    favoritesCountText: {
      fontSize: 13,
      fontWeight: "800",
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
}