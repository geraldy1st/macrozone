import FavoriteStar from "@/components/FavoriteStar";
import RecipeAttribution from "@/components/RecipeAttribution";
import MealShareCard from "@/components/MealShareCard";
import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { isFavorite, toggleFavorite } from "@/storage/favorites";
import { getMealById, type Meal } from "@/storage/meals";
import type { ThemeColors } from "@/styles/themes";
import {
  addFavoriteMealForToday,
  checkFavoriteDuplicateToday,
} from "@/utils/addMealFromFavorite";
import { captureAndShareMealImage } from "@/utils/shareMealImage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(20, false);
  const shareRef = useRef<View>(null);
  const [meal, setMeal] = useState<Meal | null>(null);
  const [favorited, setFavorited] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const loadMeal = useCallback(async () => {
    if (!id) {
      return;
    }

    const data = await getMealById(id);
    setMeal(data);
    setFavorited(await isFavorite(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadMeal();
    }, [loadMeal]),
  );

  const handleToggleFavorite = async () => {
    if (!id) {
      return;
    }

    const next = await toggleFavorite(id);
    setFavorited(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(
      next ? t("mealItem.favoriteAdded") : t("mealItem.favoriteRemoved"),
      "info",
    );
  };

  const confirmAddForToday = async () => {
    if (!meal) {
      return;
    }

    await addFavoriteMealForToday(meal);
    showToast(t("allMeals.addedForToday"), "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddForToday = async () => {
    if (!meal) {
      return;
    }

    const isDuplicate = await checkFavoriteDuplicateToday(meal.id);

    if (isDuplicate) {
      showAlert({
        title: t("allMeals.duplicateTitle"),
        message: t("allMeals.duplicateMessage", { name: meal.name }),
        buttons: [
          { text: t("mealItem.cancel"), style: "cancel" },
          {
            text: t("allMeals.duplicateConfirm"),
            onPress: confirmAddForToday,
          },
        ],
      });
      return;
    }

    await confirmAddForToday();
  };

  const handleShare = async () => {
    if (!meal) {
      return;
    }

    setIsSharing(true);

    try {
      await captureAndShareMealImage(shareRef, t("mealDetail.shareTitle"));
    } catch {
      showToast(t("share.errorMessage"), "error");
    } finally {
      setIsSharing(false);
    }
  };

  if (!meal) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topActions}>
          <FavoriteStar
            isFavorite={favorited}
            onPress={handleToggleFavorite}
            size={24}
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push(`/meal/edit/${meal.id}` as Href)}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleShare}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="share-outline" size={22} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {meal.photoUri ? (
          <Image source={{ uri: meal.photoUri }} style={styles.photo} contentFit="cover" />
        ) : (
          <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface }]}>
            <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
          </View>
        )}

        <Text style={[styles.name, { color: colors.text }]}>{meal.name}</Text>
        <Text style={[styles.macros, { color: colors.primary }]}>
          {t("macros.mealMacros", {
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
          })}
        </Text>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("mealDetail.description")}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            {meal.description?.trim() || t("mealDetail.noDescription")}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("mealDetail.recipe")}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            {meal.recipe?.trim() || t("mealDetail.noRecipe")}
          </Text>
          {meal.recipe?.trim() ? (
            <RecipeAttribution
              recipeSource={meal.recipeSource}
              recipeAuthorName={meal.recipeAuthorName}
            />
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.addTodayButton, { backgroundColor: colors.accent }]}
          onPress={handleAddForToday}
        >
          <Ionicons name="add-circle-outline" size={20} color={colors.background} />
          <Text style={[styles.addTodayText, { color: colors.background }]}>
            {t("allMeals.addForToday")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.offscreen} pointerEvents="none">
        <MealShareCard ref={shareRef} meal={meal} />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 12,
    },
    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      paddingHorizontal: 20,
      gap: 16,
    },
    photo: {
      width: "100%",
      height: 220,
      borderRadius: 16,
    },
    photoPlaceholder: {
      width: "100%",
      height: 220,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    name: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    macros: {
      fontSize: 15,
      fontWeight: "600",
    },
    section: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 16,
      gap: 8,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
    },
    sectionBody: {
      fontSize: 14,
      lineHeight: 22,
    },
    addTodayButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 16,
      borderRadius: 14,
      marginTop: 4,
    },
    addTodayText: {
      fontSize: 16,
      fontWeight: "700",
    },
    offscreen: {
      position: "absolute",
      left: -5000,
      top: 0,
      opacity: 0,
    },
  });
}