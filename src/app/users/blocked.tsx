import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { listBlockedProfiles, unblockUser } from "@/services/community";
import type { CommunityProfile } from "@/types/community";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function BlockedUsersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(20, false);

  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setProfiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const rows = await listBlockedProfiles(user.id);
      setProfiles(rows);
    } catch {
      showToast(t("social.blockedLoadError"), "error");
      setProfiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, showToast, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleUnblock = async (profile: CommunityProfile) => {
    if (!user) {
      return;
    }

    setBusyId(profile.id);
    try {
      await unblockUser(user.id, profile.id);
      setProfiles((current) => current.filter((p) => p.id !== profile.id));
      showToast(t("social.unblockSuccess"), "success");
    } catch {
      showToast(t("social.unblockError"), "error");
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
          testID="blocked-users-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {t("social.blockedUsers")}
        </Text>
        <View style={styles.backButton} />
      </View>

      {!user ? (
        <View style={styles.centered}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("community.authRequiredTitle")}
          </Text>
          <TouchableOpacity
            style={[styles.signInBtn, { backgroundColor: colors.accent }]}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.signInText, { color: colors.background }]}>
              {t("auth.signIn")}
            </Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: bottomPadding, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="checkmark-circle-outline" size={40} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {t("social.blockedEmptyTitle")}
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("social.blockedEmptyMessage")}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={[
                styles.row,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <TouchableOpacity
                style={styles.rowMain}
                onPress={() => router.push(`/u/${item.id}` as Href)}
                activeOpacity={0.75}
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
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {item.display_name?.trim() || t("profile.displayNameFallback")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.unblockBtn, { borderColor: colors.cardBorder }]}
                onPress={() => void handleUnblock(item)}
                disabled={busyId === item.id}
                testID={`unblock-user-${item.id}`}
              >
                {busyId === item.id ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text style={[styles.unblockText, { color: colors.text }]}>
                    {t("social.unblock")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
      marginBottom: 16,
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
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    },
    rowMain: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      minWidth: 0,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 44,
      height: 44,
    },
    name: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
    },
    unblockBtn: {
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      minWidth: 90,
      alignItems: "center",
    },
    unblockText: {
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
    signInBtn: {
      marginTop: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
    },
    signInText: {
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
