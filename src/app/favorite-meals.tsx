import MealItem from "@/components/MealItem";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getFavoriteIds } from "@/storage/favorites";
import { getMeals, Meal } from "@/storage/meals";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FavoriteMealsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const loadData = async () => {
    const [allMeals, ids] = await Promise.all([getMeals(), getFavoriteIds()]);
    setMeals(allMeals);
    setFavoriteIds(ids);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const favoriteMeals = useMemo(
    () => meals.filter((meal) => favoriteIds.includes(meal.id)),
    [meals, favoriteIds],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("allMeals.favoritesTitle")}
        </Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={favoriteMeals}
        keyExtractor={(meal) => meal.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="star-outline" size={36} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("allMeals.favoritesEmpty")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MealItem
            id={item.id}
            name={item.name}
            calories={item.calories}
            protein={item.protein}
            carbs={item.carbs}
            fat={item.fat}
            photoUri={item.photoUri}
            isFavorite
            enableFavorite
            onToggleFavorite={loadData}
            onDelete={loadData}
          />
        )}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 40,
      flexGrow: 1,
    },
    emptyCard: {
      marginTop: 40,
      borderRadius: 16,
      borderWidth: 1,
      padding: 28,
      alignItems: "center",
      gap: 12,
    },
    emptyText: {
      fontSize: 15,
      textAlign: "center",
      lineHeight: 22,
    },
  });
}