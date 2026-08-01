import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { fetchPostById } from "@/services/community";
import {
  getSavedCommunityMealById,
  isCommunityMealSaved,
  removeSavedCommunityMeal,
  toggleSavedCommunityMeal,
  type SavedCommunityMeal,
} from "@/storage/savedCommunityMeals";
import type { FeedPost } from "@/types/community";
import type { ThemeColors } from "@/styles/themes";
import { macroColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function savedToDisplay(meal: SavedCommunityMeal): FeedPost {
  return {
    id: meal.id,
    author_id: meal.authorId ?? "",
    meal_name: meal.name,
    caption: meal.caption ?? "",
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    image_path: null,
    description: meal.description ?? null,
    recipe_excerpt: meal.recipe ?? null,
    likes_count: 0,
    comments_count: 0,
    created_at: meal.savedAt,
    deleted_at: null,
    author: meal.authorName
      ? { id: meal.authorId ?? "", display_name: meal.authorName, avatar_url: null }
      : null,
    image_url: meal.imageUrl ?? null,
  };
}

export default function CommunityPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(20, false);
  const [post, setPost] = useState<FeedPost | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let loaded: FeedPost | null = null;
      try {
        loaded = await fetchPostById(id);
      } catch {
        loaded = null;
      }

      if (!loaded) {
        const saved = await getSavedCommunityMealById(id);
        if (saved) {
          loaded = savedToDisplay(saved);
        }
      }

      setPost(loaded);
      setIsSaved(await isCommunityMealSaved(id));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleToggleSave = async () => {
    if (!post) {
      return;
    }

    if (!user) {
      showAlert({
        title: t("community.authRequiredTitle"),
        message: t("community.authRequiredSave"),
        buttons: [
          { text: t("mealItem.cancel"), style: "cancel" },
          {
            text: t("auth.signIn"),
            onPress: () => router.push("/login"),
          },
        ],
      });
      return;
    }

    const next = await toggleSavedCommunityMeal(post);
    setIsSaved(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(
      next ? t("community.saveAdded") : t("community.saveRemoved"),
      "info",
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {t("community.postNotFound")}
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontWeight: "700" }}>
            {t("auth.back")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const authorName =
    post.author?.display_name?.trim() || t("community.unknownAuthor");

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="community-post-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.topTitle, { color: colors.text }]} numberOfLines={1}>
          {post.meal_name}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => void handleToggleSave()}
          testID="community-post-save-btn"
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={isSaved ? colors.accent : colors.text}
          />
        </TouchableOpacity>
      </View>

      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.photo}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.photoPlaceholder, { backgroundColor: colors.surface }]}>
          <Ionicons name="restaurant-outline" size={40} color={colors.textSecondary} />
        </View>
      )}

      <Text style={[styles.mealName, { color: colors.text }]}>{post.meal_name}</Text>
      <TouchableOpacity
        disabled={!post.author_id}
        onPress={() => {
          if (post.author_id) {
            router.push(`/u/${post.author_id}`);
          }
        }}
        testID="community-post-author-link"
      >
        <Text style={[styles.author, { color: colors.primary }]}>
          {t("community.byAuthor", { name: authorName })}
        </Text>
      </TouchableOpacity>

      <View style={styles.macroRow}>
        <MacroBox
          label={t("macros.calories")}
          value={String(post.calories)}
          color={macroColors.calories}
          colors={colors}
        />
        <MacroBox label="P" value={`${post.protein}g`} color={macroColors.protein} colors={colors} />
        <MacroBox label="C" value={`${post.carbs}g`} color={macroColors.carbs} colors={colors} />
        <MacroBox label="F" value={`${post.fat}g`} color={macroColors.fat} colors={colors} />
      </View>

      {post.caption.trim() ? (
        <View style={[styles.section, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t("community.captionLabel")}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            {post.caption}
          </Text>
        </View>
      ) : null}

      {post.description ? (
        <View style={[styles.section, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t("mealDetail.description")}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            {post.description}
          </Text>
        </View>
      ) : null}

      {post.recipe_excerpt ? (
        <View style={[styles.section, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>
            {t("mealDetail.recipe")}
          </Text>
          <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>
            {post.recipe_excerpt}
          </Text>
        </View>
      ) : null}

      {isSaved ? (
        <TouchableOpacity
          style={[styles.removeSave, { borderColor: colors.cardBorder }]}
          onPress={async () => {
            await removeSavedCommunityMeal(post.id);
            setIsSaved(false);
            showToast(t("community.saveRemoved"), "info");
          }}
        >
          <Text style={{ color: colors.textSecondary, fontWeight: "600" }}>
            {t("community.removeFromSaved")}
          </Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  );
}

function MacroBox({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string;
  color: string;
  colors: ThemeColors;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.card,
        borderColor: colors.cardBorder,
        borderWidth: 1,
        borderRadius: 12,
        padding: 10,
        alignItems: "center",
        gap: 4,
      }}
    >
      <Text style={{ color, fontSize: 11, fontWeight: "700" }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>{value}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 24,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    topTitle: {
      flex: 1,
      textAlign: "center",
      fontSize: 16,
      fontWeight: "700",
    },
    photo: {
      width: "100%",
      height: 240,
      borderRadius: 16,
      marginBottom: 16,
    },
    photoPlaceholder: {
      width: "100%",
      height: 180,
      borderRadius: 16,
      marginBottom: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    mealName: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.4,
    },
    author: {
      fontSize: 14,
      fontWeight: "500",
      marginTop: 6,
      marginBottom: 16,
    },
    macroRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 18,
    },
    section: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    sectionBody: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: "500",
    },
    removeSave: {
      marginTop: 8,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },
  });
}
