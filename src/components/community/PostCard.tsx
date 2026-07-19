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
  onLikePress?: () => void;
  onDeletePress?: () => void;
  likeDisabled?: boolean;
};

export default function PostCard({
  post,
  isOwner,
  onLikePress,
  onDeletePress,
  likeDisabled,
}: PostCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const authorName =
    post.author?.display_name?.trim() || t("community.unknownAuthor");
  const relative = formatRelativeTime(post.created_at, i18n.language);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      testID={`community-post-${post.id}`}
    >
      <View style={styles.header}>
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
        {isOwner && onDeletePress ? (
          <TouchableOpacity
            onPress={onDeletePress}
            hitSlop={10}
            testID={`delete-post-${post.id}`}
          >
            <Ionicons name="trash-outline" size={18} color={colors.alert} />
          </TouchableOpacity>
        ) : null}
      </View>

      {post.image_url ? (
        <Image
          source={{ uri: post.image_url }}
          style={styles.photo}
          contentFit="cover"
        />
      ) : null}

      <Text style={[styles.mealName, { color: colors.text }]}>{post.meal_name}</Text>

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
          testID={`like-post-${post.id}`}
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

        <View style={styles.action}>
          <Ionicons
            name="chatbubble-outline"
            size={18}
            color={colors.textSecondary}
          />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            {post.comments_count}
          </Text>
        </View>
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
