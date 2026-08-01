import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { searchProfiles, toggleFollow } from "@/services/community";
import type { ProfileListItem } from "@/types/community";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const SEARCH_DEBOUNCE_MS = 300;

export default function UserSearchScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, isConfigured } = useAuth();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(20, false);

  const [searchInput, setSearchInput] = useState("");
  const [debounced, setDebounced] = useState("");
  const [results, setResults] = useState<ProfileListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    if (!isConfigured) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      const rows = await searchProfiles({
        query: debounced,
        currentUserId: user?.id ?? null,
      });
      setResults(rows);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [debounced, isConfigured, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleFollow = async (item: ProfileListItem) => {
    if (!user) {
      showToast(t("social.authRequiredFollow"), "info");
      router.push("/login");
      return;
    }

    setBusyId(item.id);
    const prev = Boolean(item.is_following);
    setResults((current) =>
      current.map((row) =>
        row.id === item.id
          ? {
              ...row,
              is_following: !prev,
              followers_count: Math.max(
                0,
                (row.followers_count ?? 0) + (prev ? -1 : 1),
              ),
            }
          : row,
      ),
    );

    try {
      await toggleFollow(user.id, item.id, prev);
    } catch {
      setResults((current) =>
        current.map((row) =>
          row.id === item.id
            ? {
                ...row,
                is_following: prev,
                followers_count: Math.max(
                  0,
                  (row.followers_count ?? 0) + (prev ? 1 : -1),
                ),
              }
            : row,
        ),
      );
      showToast(t("social.followError"), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          testID="user-search-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {t("social.findPeople")}
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/users/blocked" as Href)}
          testID="user-search-blocked-btn"
          accessibilityLabel={t("social.blockedUsers")}
        >
          <Ionicons name="ban-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchRow,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <Ionicons name="search" size={18} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t("social.searchPlaceholder")}
          placeholderTextColor={colors.textSecondary}
          value={searchInput}
          onChangeText={setSearchInput}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          testID="user-search-input"
        />
        {searchInput.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchInput("")} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {!isConfigured ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("auth.notConfiguredTitle")}
          </Text>
        </View>
      ) : isLoading && results.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("social.searchError")}
          </Text>
          <TouchableOpacity onPress={() => void load()}>
            <Text style={{ color: colors.primary, fontWeight: "700" }}>
              {t("community.retry")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="people-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t("social.searchEmptyTitle")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("social.searchEmptyMessage")}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
              onPress={() => router.push(`/u/${item.id}` as Href)}
              activeOpacity={0.75}
              testID={`user-search-row-${item.id}`}
            >
              <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                {item.avatar_url ? (
                  <Image
                    source={{ uri: item.avatar_url }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons name="person" size={20} color={colors.textSecondary} />
                )}
              </View>

              <View style={styles.rowBody}>
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.name, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.display_name?.trim() || t("profile.displayNameFallback")}
                  </Text>
                  {item.is_online ? (
                    <View style={styles.onlineDot} testID={`user-online-${item.id}`} />
                  ) : null}
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  {t("social.followersCount", {
                    count: item.followers_count ?? 0,
                  })}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.followBtn,
                  {
                    backgroundColor: item.is_following
                      ? colors.surface
                      : colors.accent,
                    borderColor: colors.cardBorder,
                    borderWidth: item.is_following ? 1 : 0,
                  },
                ]}
                onPress={() => void handleFollow(item)}
                disabled={busyId === item.id}
                testID={`user-search-follow-${item.id}`}
              >
                {busyId === item.id ? (
                  <ActivityIndicator
                    size="small"
                    color={item.is_following ? colors.text : colors.background}
                  />
                ) : (
                  <Text
                    style={[
                      styles.followBtnText,
                      {
                        color: item.is_following
                          ? colors.text
                          : colors.background,
                      },
                    ]}
                  >
                    {item.is_following ? t("social.unfollow") : t("social.follow")}
                  </Text>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          )}
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
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 14,
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
      flex: 1,
      textAlign: "center",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 14,
      minHeight: 44,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      padding: 0,
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
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 48,
      height: 48,
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    name: {
      fontSize: 16,
      fontWeight: "700",
      flexShrink: 1,
    },
    onlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#22c55e",
    },
    meta: {
      fontSize: 13,
      fontWeight: "500",
    },
    followBtn: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      minWidth: 88,
      alignItems: "center",
    },
    followBtnText: {
      fontSize: 13,
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
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
    },
    emptyText: {
      fontSize: 14,
      lineHeight: 20,
      textAlign: "center",
      fontWeight: "500",
    },
  });
}
