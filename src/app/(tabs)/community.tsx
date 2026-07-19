import PostCard from "@/components/community/PostCard";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useFeed } from "@/hooks/useFeed";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { deleteMyPost, toggleLike } from "@/services/community";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CommunityScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, isConfigured } = useAuth();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding();
  const {
    posts,
    isLoading,
    isLoadingMore,
    error,
    nextCursor,
    refresh,
    loadMore,
    removePostLocally,
    patchPostLocally,
  } = useFeed();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleLike = async (postId: string, likedByMe: boolean, likesCount: number) => {
    if (!user) {
      showAlert({
        title: t("community.authRequiredTitle"),
        message: t("community.authRequiredLike"),
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

    const nextLiked = !likedByMe;
    patchPostLocally(postId, {
      liked_by_me: nextLiked,
      likes_count: Math.max(0, likesCount + (nextLiked ? 1 : -1)),
    });

    try {
      await toggleLike(postId, user.id, likedByMe);
    } catch {
      patchPostLocally(postId, {
        liked_by_me: likedByMe,
        likes_count: likesCount,
      });
      showToast(t("community.likeError"), "error");
    }
  };

  const handleDelete = (postId: string) => {
    if (!user) {
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
              await deleteMyPost(postId, user.id);
              removePostLocally(postId);
              showToast(t("community.deleteSuccess"), "success");
            } catch {
              showToast(t("community.deleteError"), "error");
            }
          },
        },
      ],
    });
  };

  const schemaMissing =
    error?.includes("relation") ||
    error?.includes("does not exist") ||
    error?.includes("schema cache") ||
    error?.toLowerCase().includes("posts");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t("community.title")}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t("community.subtitle")}
      </Text>

      {!user && isConfigured ? (
        <View
          style={[
            styles.banner,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.bannerText, { color: colors.textSecondary }]}>
            {t("community.guestBanner")}
          </Text>
          <TouchableOpacity
            style={[styles.bannerButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.bannerButtonText, { color: colors.background }]}>
              {t("auth.signIn")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading && posts.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error && posts.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {schemaMissing
              ? t("community.setupRequiredTitle")
              : t("community.loadErrorTitle")}
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {schemaMissing
              ? t("community.setupRequiredMessage")
              : t("community.loadErrorMessage")}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: colors.cardBorder }]}
            onPress={() => void refresh()}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>
              {t("community.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={() => void refresh()}
              tintColor={colors.accent}
            />
          }
          onEndReached={() => {
            if (nextCursor) {
              void loadMore();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t("community.emptyTitle")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("community.emptyMessage")}
              </Text>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator
                style={{ marginVertical: 16 }}
                color={colors.accent}
              />
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isOwner={Boolean(user && user.id === item.author_id)}
              onLikePress={() =>
                void handleLike(item.id, Boolean(item.liked_by_me), item.likes_count)
              }
              onDeletePress={
                user && user.id === item.author_id
                  ? () => handleDelete(item.id)
                  : undefined
              }
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    title: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      marginTop: 6,
      marginBottom: 14,
      fontWeight: "500",
    },
    banner: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 14,
      gap: 10,
      marginBottom: 14,
    },
    bannerText: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
    },
    bannerButton: {
      alignSelf: "flex-start",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
    },
    bannerButtonText: {
      fontSize: 14,
      fontWeight: "700",
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      paddingHorizontal: 20,
      paddingVertical: 40,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: "700",
      textAlign: "center",
      marginTop: 8,
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      fontWeight: "500",
    },
    retryButton: {
      marginTop: 8,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    retryText: {
      fontSize: 14,
      fontWeight: "700",
    },
  });
}
