import { useTheme } from "@/contexts/ThemeContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getProfile } from "@/services/community";
import type { CommunityProfile } from "@/types/community";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * Public profile opened via deep link: macrozone://u/{userId}
 */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(20, false);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!id) {
        setError(true);
        setIsLoading(false);
        return;
      }

      try {
        const row = await getProfile(id);
        if (!cancelled) {
          setProfile(row);
          setError(!row);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const displayName =
    profile?.display_name?.trim() || t("profile.displayNameFallback");

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingBottom: bottomPadding },
      ]}
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/(tabs)");
            }
          }}
          testID="public-profile-back-btn"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("profile.publicTitle")}
        </Text>
        <View style={styles.backButton} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : error || !profile ? (
        <View style={styles.centered}>
          <Ionicons name="person-outline" size={40} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {t("profile.publicNotFound")}
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            {profile.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={42} color={colors.textSecondary} />
            )}
          </View>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t("profile.publicHint")}
          </Text>
          <TouchableOpacity
            style={[styles.cta, { backgroundColor: colors.accent }]}
            onPress={() => router.replace("/(tabs)/community")}
            testID="public-profile-community-btn"
          >
            <Text style={[styles.ctaText, { color: colors.background }]}>
              {t("profile.publicOpenCommunity")}
            </Text>
          </TouchableOpacity>
        </View>
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
      marginBottom: 24,
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
    centered: {
      alignItems: "center",
      gap: 12,
      marginTop: 48,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      textAlign: "center",
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 24,
      alignItems: "center",
      gap: 12,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: 110,
      height: 110,
    },
    name: {
      fontSize: 22,
      fontWeight: "800",
    },
    hint: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "500",
    },
    cta: {
      marginTop: 8,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderRadius: 12,
    },
    ctaText: {
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
