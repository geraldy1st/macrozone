import { useTheme } from "@/contexts/ThemeContext";
import type { FeedPost } from "@/types/community";
import { formatRelativeTime } from "@/utils/relativeTime";
import { macroColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type PostCardProps = {
  post: FeedPost;
  isOwner?: boolean;
  isSaved?: boolean;
  onLikePress?: () => void;
  onCommentPress?: () => void;
  onSavePress?: () => void;
  onImagePress?: () => void;
  onAuthorPress?: () => void;
  onDeletePress?: () => void;
  likeDisabled?: boolean;
  saveDisabled?: boolean;
  /** Stable index for Maestro e2e (e.g. 0 = first post). */
  testIndex?: number;
};

export default function PostCard({
  post,
  isOwner,
  isSaved,
  onLikePress,
  onCommentPress,
  onSavePress,
  onImagePress,
  onAuthorPress,
  onDeletePress,
  likeDisabled,
  saveDisabled,
  testIndex,
}: PostCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const authorName =
    post.author?.display_name?.trim() || t("community.unknownAuthor");
  const relative = formatRelativeTime(post.created_at, i18n.language);
  const likeId =
    testIndex !== undefined ? `like-post-index-${testIndex}` : `like-post-${post.id}`;
  const commentId =
    testIndex !== undefined
      ? `comment-post-index-${testIndex}`
      : `comment-post-${post.id}`;
  const saveId =
    testIndex !== undefined
      ? `save-post-index-${testIndex}`
      : `save-post-${post.id}`;
  const deleteId =
    testIndex !== undefined
      ? `delete-post-index-${testIndex}`
      : `delete-post-${post.id}`;
  const cardId =
    testIndex !== undefined
      ? `community-post-index-${testIndex}`
      : `community-post-${post.id}`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      testID={cardId}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.authorPressable}
          onPress={onAuthorPress}
          disabled={!onAuthorPress}
          activeOpacity={onAuthorPress ? 0.7 : 1}
          testID={
            testIndex !== undefined
              ? `community-post-author-index-${testIndex}`
              : `community-post-author-${post.id}`
          }
        >
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            {post.author?.avatar_url ? (
              <Image
                source={{ uri: post.author.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={18} color={colors.textSecondary} />
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.author, { color: colors.text }]} numberOfLines={1}>
              {authorName}
            </Text>
            <Text style={[styles.meta, { color: colors.textSecondary }]}>
              {relative}
            </Text>
          </View>
        </TouchableOpacity>
        {isOwner && onDeletePress ? (
          <TouchableOpacity
            onPress={onDeletePress}
            hitSlop={10}
            testID={deleteId}
          >
            <Ionicons name="trash-outline" size={18} color={colors.alert} />
          </TouchableOpacity>
        ) : null}
      </View>

      {post.image_url ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onImagePress}
          disabled={!onImagePress}
          testID={
            testIndex !== undefined
              ? `community-post-image-index-${testIndex}`
              : `community-post-image-${post.id}`
          }
        >
          <Image
            source={{ uri: post.image_url }}
            style={styles.photo}
            contentFit="cover"
          />
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        activeOpacity={onImagePress ? 0.7 : 1}
        onPress={onImagePress}
        disabled={!onImagePress}
      >
        <Text style={[styles.mealName, { color: colors.text }]}>{post.meal_name}</Text>
      </TouchableOpacity>

      <View style={styles.macros}>
        <MacroPill label={t("macros.calories")} value={post.calories} color={macroColors.calories} />
        <MacroPill label="P" value={`${post.protein}g`} color={macroColors.protein} />
        <MacroPill label="C" value={`${post.carbs}g`} color={macroColors.carbs} />
        <MacroPill label="F" value={`${post.fat}g`} color={macroColors.fat} />
      </View>

      {post.caption.trim() ? (
        <Text style={[styles.caption, { color: colors.textSecondary }]}>
          {post.caption}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.action}
          onPress={onLikePress}
          disabled={likeDisabled || !onLikePress}
          testID={likeId}
        >
          <Ionicons
            name={post.liked_by_me ? "heart" : "heart-outline"}
            size={20}
            color={post.liked_by_me ? colors.alert : colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.likes_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={onCommentPress}
          disabled={!onCommentPress}
          testID={commentId}
        >
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.comments_count}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.action}
          onPress={onSavePress}
          disabled={saveDisabled || !onSavePress}
          testID={saveId}
          accessibilityLabel={t("community.saveMeal")}
        >
          <Ionicons
            name={isSaved ? "bookmark" : "bookmark-outline"}
            size={18}
            color={isSaved ? colors.accent : colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MacroPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <View style={[pillStyles.pill, { borderColor: `${color}66`, backgroundColor: `${color}18` }]}>
      <Text style={[pillStyles.text, { color }]}>
        {label} {value}
      </Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    card: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 14,
      gap: 12,
      marginBottom: 14,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    authorPressable: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      minWidth: 0,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 36,
      height: 36,
    },
    headerText: {
      flex: 1,
      minWidth: 0,
    },
    author: {
      fontSize: 15,
      fontWeight: "700",
    },
    meta: {
      fontSize: 12,
      fontWeight: "500",
      marginTop: 1,
    },
    photo: {
      width: "100%",
      height: 200,
      borderRadius: 12,
    },
    mealName: {
      fontSize: 17,
      fontWeight: "800",
    },
    macros: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    caption: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 18,
      paddingTop: 2,
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    actionText: {
      fontSize: 14,
      fontWeight: "600",
    },
  });
}

const pillStyles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
  },
});
