import MealItem from "@/components/MealItem";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getFavoriteIds } from "@/storage/favorites";
import { deleteMeals, getMeals, Meal } from "@/storage/meals";
import { globalStyles } from "@/styles/global";
import type { ThemeColors } from "@/styles/themes";
import {
  formatMealDayLabel,
  groupMealsByDay,
} from "@/utils/groupMealsByDay";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, type Href } from "expo-router";
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
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const loadMeals = async () => {
    const [data, ids] = await Promise.all([getMeals(), getFavoriteIds()]);
    setMeals(data);
    setFavoriteIds(ids);
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

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      exitSelectionMode();
      return;
    }

    setSelectionMode(true);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = () => {
    const count = selectedIds.size;

    if (count === 0) {
      return;
    }

    showAlert({
      title: t("allMeals.deleteSelectedTitle"),
      message: t("allMeals.deleteSelectedMessage", { count }),
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        {
          text: t("mealItem.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteMeals([...selectedIds]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(t("allMeals.deleteSelectedSuccess", { count }), "success");
            exitSelectionMode();
            loadMeals();
          },
        },
      ],
    });
  };

  return (
    <SectionList
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      sections={sections}
      keyExtractor={(meal) => meal.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      ListHeaderComponent={
        <View>
          <View style={globalStyles.header}>
            <Text style={[globalStyles.title, { color: colors.text }]}>
              {t("allMeals.title")}
            </Text>
            <TouchableOpacity onPress={toggleSelectionMode} testID="toggle-edit-mode">
              <Text style={[styles.editButton, { color: colors.accent }]}>
                {selectionMode ? t("allMeals.done") : t("allMeals.editMode")}
              </Text>
            </TouchableOpacity>
          </View>

          {selectionMode && selectedIds.size > 0 && (
            <TouchableOpacity
              style={[styles.deleteSelectedButton, { backgroundColor: colors.alert }]}
              onPress={handleDeleteSelected}
              testID="delete-selected-btn"
            >
              <Ionicons name="trash-outline" size={18} color={colors.background} />
              <Text style={[styles.deleteSelectedText, { color: colors.background }]}>
                {t("allMeals.deleteSelected", { count: selectedIds.size })}
              </Text>
            </TouchableOpacity>
          )}

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
          showFavoriteStar
          onToggleFavorite={loadMeals}
          onPress={() => router.push(`/meal/${item.id}` as Href)}
          selectionMode={selectionMode}
          isSelected={selectedIds.has(item.id)}
          onToggleSelect={() => toggleSelect(item.id)}
          onDelete={loadMeals}
        />
      )}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
    },
    editButton: {
      fontSize: 16,
      fontWeight: "600",
    },
    deleteSelectedButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    deleteSelectedText: {
      fontSize: 15,
      fontWeight: "700",
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