import { useTheme } from "@/contexts/ThemeContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  getSavedCommunityMeals,
  type SavedCommunityMeal,
} from "@/storage/savedCommunityMeals";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SavedCommunityMealsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(20, false);
  const [meals, setMeals] = useState<SavedCommunityMeal[]>([]);

  useFocusEffect(
    useCallback(() => {
      void getSavedCommunityMeals().then(setMeals);
    }, []),
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("allMeals.savedCommunityTitle")}
        </Text>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={meals}
        keyExtractor={(meal) => meal.id}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        ListEmptyComponent={
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="bookmark-outline" size={36} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t("allMeals.savedCommunityEmpty")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.row,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
            onPress={() =>
              router.push(`/community/post/${item.id}` as Href)
            }
            testID={`saved-community-meal-${item.id}`}
          >
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.thumb}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.thumb, { backgroundColor: colors.surface }]}>
                <Ionicons name="restaurant-outline" size={22} color={colors.textSecondary} />
              </View>
            )}
            <View style={styles.rowText}>
              <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                {item.calories} kcal
                {item.authorName ? ` · ${item.authorName}` : ""}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
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
      marginBottom: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
    },
    content: {
      paddingHorizontal: 20,
      gap: 10,
    },
    emptyCard: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 28,
      alignItems: "center",
      gap: 12,
      marginTop: 20,
    },
    emptyText: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "500",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    rowText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    rowName: {
      fontSize: 16,
      fontWeight: "700",
    },
    rowMeta: {
      fontSize: 13,
      fontWeight: "500",
    },
  });
}
