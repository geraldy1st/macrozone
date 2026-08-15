import ImageZoomViewer from "@/components/ImageZoomViewer";
import CommentSheet from "@/components/community/CommentSheet";
import EditPostModal from "@/components/community/EditPostModal";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  deleteMyPost,
  fetchPostById,
  toggleLike,
  updateMyPost,
} from "@/services/community";
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
import {
  addCommunityMealForToday,
  checkCommunityDuplicateToday,
} from "@/utils/addMealFromCommunity";
import { isPostEdited } from "@/utils/postEdited";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const DETAIL_PHOTO_SIZE = Math.min(Dimensions.get("window").width - 40, 420);

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
  // Extra room above Android system nav / gesture bar (A011-3).
  const bottomPadding = useBottomContentPadding(48, false);
  const [post, setPost] = useState<FeedPost | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  /** True when post was loaded from Supabase (interactive). False for offline saved-only. */
  const [isRemote, setIsRemote] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let loaded: FeedPost | null = null;
      let remote = false;
      try {
        loaded = await fetchPostById(id, { currentUserId: user?.id ?? null });
        remote = Boolean(loaded);
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
      setIsRemote(remote);
      setIsSaved(await isCommunityMealSaved(id));
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const isOwner = Boolean(user && post && user.id === post.author_id);

  const confirmAddToday = async () => {
    if (!post) {
      return;
    }
    await addCommunityMealForToday(post);
    showToast(t("allMeals.addedForToday"), "success");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push("/(tabs)" as Href);
  };

  const handleAddToday = async () => {
    if (!post) {
      return;
    }
    const isDuplicate = await checkCommunityDuplicateToday(post.id);
    if (isDuplicate) {
      showAlert({
        title: t("allMeals.duplicateTitle"),
        message: t("allMeals.duplicateMessage", { name: post.meal_name }),
        buttons: [
          { text: t("mealItem.cancel"), style: "cancel" },
          {
            text: t("allMeals.duplicateConfirm"),
            onPress: () => void confirmAddToday(),
          },
        ],
      });
      return;
    }
    await confirmAddToday();
  };

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

  const handleLike = async () => {
    if (!post || !isRemote) {
      return;
    }

    if (!user) {
      showAlert({
        title: t("community.authRequiredTitle"),
        message: t("community.authRequiredLike"),
        buttons: [
          { text: t("mealItem.cancel"), style: "cancel" },
          { text: t("auth.signIn"), onPress: () => router.push("/login") },
        ],
      });
      return;
    }

    const likedByMe = Boolean(post.liked_by_me);
    const likesCount = post.likes_count;
    const nextLiked = !likedByMe;

    setLikeBusy(true);
    setPost((current) =>
      current
        ? {
            ...current,
            liked_by_me: nextLiked,
            likes_count: Math.max(0, likesCount + (nextLiked ? 1 : -1)),
          }
        : current,
    );

    try {
      await toggleLike(post.id, user.id, likedByMe);
    } catch {
      setPost((current) =>
        current
          ? {
              ...current,
              liked_by_me: likedByMe,
              likes_count: likesCount,
            }
          : current,
      );
      showToast(t("community.likeError"), "error");
    } finally {
      setLikeBusy(false);
    }
  };

  const handleDelete = () => {
    if (!user || !post || !isOwner) {
      return;
    }

    showAlert({
      title: t("community.deleteTitle"),
      message: t("community.deleteMessage"),
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        {
          text: t("mealItem.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMyPost(post.id, user.id);
              showToast(t("community.deleteSuccess"), "success");
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/community" as Href);
              }
            } catch {
              showToast(t("community.deleteError"), "error");
            }
          },
        },
      ],
    });
  };

  const handleSaveEdit = async (input: { mealName: string; caption: string }) => {
    if (!user || !post || !isOwner) {
      return;
    }

    setIsSavingEdit(true);
    try {
      const updated = await updateMyPost(post.id, user.id, {
        mealName: input.mealName,
        caption: input.caption,
      });
      setPost((current) =>
        current
          ? {
              ...current,
              meal_name: updated.meal_name,
              caption: updated.caption,
              updated_at: updated.updated_at,
            }
          : current,
      );
      setEditOpen(false);
      showToast(t("community.editSuccess"), "success");
    } catch {
      showToast(t("community.editError"), "error");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const copyCaption = async () => {
    if (!post?.caption.trim()) {
      return;
    }
    try {
      await Clipboard.setStringAsync(post.caption.trim());
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(t("community.captionCopied"), "success");
    } catch {
      showToast(t("community.captionCopyError"), "error");
    }
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
    <>
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
          <View style={styles.topActions}>
            {isOwner ? (
              <>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={() => setEditOpen(true)}
                  testID="community-post-edit-btn"
                >
                  <Ionicons name="create-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconBtn}
                  onPress={handleDelete}
                  testID="community-post-delete-btn"
                >
                  <Ionicons name="trash-outline" size={20} color={colors.alert} />
                </TouchableOpacity>
              </>
            ) : null}
            <TouchableOpacity
              style={styles.iconBtn}
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
        </View>

        {post.image_url ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setZoomOpen(true)}
            testID="community-post-detail-image"
          >
            <Image
              source={{ uri: post.image_url }}
              style={[
                styles.photo,
                { width: DETAIL_PHOTO_SIZE, height: DETAIL_PHOTO_SIZE },
              ]}
              contentFit="cover"
            />
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.photoPlaceholder,
              {
                backgroundColor: colors.surface,
                width: DETAIL_PHOTO_SIZE,
                height: DETAIL_PHOTO_SIZE,
              },
            ]}
          >
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
            {t("community.cardBy", { name: authorName })}
          </Text>
        </TouchableOpacity>
        {isPostEdited(post.created_at, post.updated_at) ? (
          <Text style={[styles.edited, { color: colors.textSecondary }]}>
            {t("community.edited")}
          </Text>
        ) : null}

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

        <TouchableOpacity
          style={[styles.addTodayButton, { backgroundColor: colors.accent }]}
          onPress={() => void handleAddToday()}
          testID="community-post-add-today"
        >
          <Text style={[styles.addTodayText, { color: colors.background }]}>
            {t("community.addToToday")}
          </Text>
        </TouchableOpacity>

        {isRemote ? (
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialAction}
              onPress={() => void handleLike()}
              disabled={likeBusy}
              testID="community-post-detail-like"
              accessibilityLabel={t("community.useful")}
            >
              <Ionicons
                name={post.liked_by_me ? "heart" : "heart-outline"}
                size={20}
                color={post.liked_by_me ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.socialCount, { color: colors.textSecondary }]}>
                {t("community.useful")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialAction}
              onPress={() => setCommentsOpen(true)}
              testID="community-post-detail-comments"
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {post.caption.trim() ? (
          <View style={[styles.section, { borderColor: colors.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: colors.primary }]}>
              {t("community.captionLabel")}
            </Text>
            <Text
              style={[styles.sectionBody, { color: colors.textSecondary }]}
              onLongPress={() => void copyCaption()}
              testID="community-post-detail-caption"
            >
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

      <ImageZoomViewer
        visible={zoomOpen}
        imageUri={post.image_url}
        onClose={() => setZoomOpen(false)}
      />

      <CommentSheet
        visible={commentsOpen}
        postId={post.id}
        onClose={() => setCommentsOpen(false)}
        onCountChange={(delta) => {
          setPost((current) =>
            current
              ? {
                  ...current,
                  comments_count: Math.max(0, current.comments_count + delta),
                }
              : current,
          );
        }}
      />

      <EditPostModal
        visible={editOpen}
        post={post}
        isSaving={isSavingEdit}
        onClose={() => setEditOpen(false)}
        onSave={(input) => void handleSaveEdit(input)}
      />
    </>
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
      gap: 4,
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
    topActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    iconBtn: {
      width: 36,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    photo: {
      borderRadius: 16,
      marginBottom: 16,
      alignSelf: "center",
    },
    photoPlaceholder: {
      borderRadius: 16,
      marginBottom: 16,
      alignSelf: "center",
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
      marginBottom: 4,
    },
    edited: {
      fontSize: 12,
      fontStyle: "italic",
      fontWeight: "500",
      marginBottom: 12,
    },
    macroRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 14,
    },
    addTodayButton: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 14,
    },
    addTodayText: {
      fontSize: 15,
      fontWeight: "800",
    },
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
      marginBottom: 18,
    },
    socialAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 6,
    },
    socialCount: {
      fontSize: 15,
      fontWeight: "700",
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
