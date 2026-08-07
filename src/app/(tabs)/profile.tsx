import ProfileShareCard from "@/components/ProfileShareCard";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { getCountryByCode } from "@/data/countries";
import {
  buildSocialUrl,
  formatSocialUrlLabel,
  getSocialPlatform,
} from "@/data/socialLinks";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { fetchPostsByAuthor, getProfile } from "@/services/community";
import {
  defaultProfile,
  getUserProfile,
  type UserProfile,
} from "@/storage/profile";
import type { ThemeColors } from "@/styles/themes";
import type { FeedPost } from "@/types/community";
import { calculateAge } from "@/utils/age";
import { captureAndShareImage } from "@/utils/shareImage";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_SIZE =
  (Dimensions.get("window").width - 40 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, isConfigured } = useAuth();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding();
  const shareRef = useRef<View>(null);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isSharing, setIsSharing] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  const load = useCallback(async () => {
    const local = await getUserProfile();
    setProfile(local);

    if (!user?.id) {
      setPosts([]);
      setFollowers(0);
      setFollowing(0);
      return;
    }

    setStatsLoading(true);
    try {
      const [remote, page] = await Promise.all([
        getProfile(user.id),
        fetchPostsByAuthor(user.id, { limit: 30 }),
      ]);
      setFollowers(remote?.followers_count ?? 0);
      setFollowing(remote?.following_count ?? 0);
      setPosts(page.posts);
    } catch {
      setPosts([]);
    } finally {
      setStatsLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const selectedCountry = getCountryByCode(profile.countryCode);
  const notSet = t("profile.notSet");
  const displayName =
    profile.name.trim() || t("profile.displayNameFallback");

  const handleShareProfile = async () => {
    if (!user?.id) {
      showToast(t("profile.shareNeedsSignIn"), "info");
      router.push("/login");
      return;
    }

    setIsSharing(true);
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      await captureAndShareImage(shareRef, t("profile.shareTitle"), {
        format: "jpg",
        quality: 0.85,
      });
    } catch {
      showToast(t("profile.shareError"), "error");
    } finally {
      setIsSharing(false);
    }
  };

  const countryDisplay = selectedCountry
    ? `${selectedCountry.flag} ${selectedCountry.name}`
    : null;

  const ageValue = calculateAge(profile.birthDate);
  const ageDisplay =
    ageValue !== null ? t("profile.ageYears", { count: ageValue }) : notSet;

  const activeLinks = profile.socialLinks.filter((link) => link.url.trim());
  const showHealth = profile.showHealth !== false;
  const showCommunityPosts = profile.showCommunityPosts !== false;
  const postCount = posts.length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("profile.title")}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.headerButton,
              { borderColor: colors.cardBorder, backgroundColor: colors.card },
            ]}
            onPress={() => router.push("/profile-edit" as Href)}
            testID="open-profile-edit-btn"
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={[styles.headerButtonText, { color: colors.accent }]}>
              {t("profile.editButton")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerButton,
              { borderColor: colors.cardBorder, backgroundColor: colors.card },
            ]}
            onPress={() => router.push("/settings")}
            testID="open-settings-btn"
          >
            <Ionicons name="settings-outline" size={18} color={colors.accent} />
            <Text style={[styles.headerButtonText, { color: colors.accent }]}>
              {t("profile.openSettings")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.avatarContainer}>
          {profile.photoUri ? (
            <Image
              source={{ uri: profile.photoUri }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View
              style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="person" size={42} color={colors.textSecondary} />
            </View>
          )}
        </View>

        <Text style={[styles.displayName, { color: colors.text }]} numberOfLines={1}>
          {displayName}
        </Text>

        <View style={styles.profileActionsRow}>
          <TouchableOpacity
            style={[
              styles.shareProfileBtn,
              { borderColor: colors.cardBorder, backgroundColor: colors.surface },
            ]}
            onPress={() => void handleShareProfile()}
            disabled={isSharing}
            testID="share-profile-btn"
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Ionicons name="share-outline" size={16} color={colors.accent} />
                <Text style={[styles.shareProfileText, { color: colors.accent }]}>
                  {t("profile.shareButton")}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.shareProfileBtn,
              { borderColor: colors.cardBorder, backgroundColor: colors.surface },
            ]}
            onPress={() => {
              if (!user) {
                showToast(t("social.authRequiredFindPeople"), "info");
                router.push("/login");
                return;
              }
              router.push("/users/search" as Href);
            }}
            testID="find-people-btn"
          >
            <Ionicons name="person-add-outline" size={16} color={colors.accent} />
            <Text style={[styles.shareProfileText, { color: colors.accent }]}>
              {t("social.findPeople")}
            </Text>
          </TouchableOpacity>
        </View>

        {user ? (
          <View style={styles.statsRow} testID="profile-stats-row">
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {statsLoading ? "—" : postCount}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t("social.posts")}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {statsLoading ? "—" : followers}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t("social.followers")}
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {statsLoading ? "—" : following}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t("social.following")}
              </Text>
            </View>
          </View>
        ) : null}

        {profile.bio.trim() ? (
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {profile.bio.trim()}
          </Text>
        ) : null}

        {countryDisplay ? (
          <Text style={[styles.countryLine, { color: colors.textSecondary }]}>
            {countryDisplay}
          </Text>
        ) : null}

        {activeLinks.length > 0 ? (
          <View style={styles.socialList}>
            {activeLinks.map((link) => {
              const platform = getSocialPlatform(link.platform);
              if (!platform) {
                return null;
              }

              const openUrl = buildSocialUrl(link.platform, link.url);

              return (
                <TouchableOpacity
                  key={`${link.platform}-${link.url}`}
                  style={[
                    styles.socialRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={() => {
                    void Linking.openURL(openUrl).catch(() => {
                      showToast(t("profile.social.openError"), "error");
                    });
                  }}
                  testID={`profile-social-${link.platform}`}
                >
                  <Ionicons
                    name={platform.icon}
                    size={20}
                    color={colors.accent}
                  />
                  <Text
                    style={[styles.socialUrl, { color: colors.primary }]}
                    numberOfLines={1}
                  >
                    {formatSocialUrlLabel(link.url)}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {!user && isConfigured && (
          <TouchableOpacity
            style={[styles.signInChip, { backgroundColor: colors.surface }]}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.signInChipText, { color: colors.primary }]}>
              {t("auth.signIn")}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {user && showCommunityPosts ? (
        <View style={styles.postsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("social.communityPosts")}
          </Text>
          {posts.length === 0 && !statsLoading ? (
            <View
              style={[
                styles.emptyPosts,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Ionicons name="images-outline" size={32} color={colors.textSecondary} />
              <Text style={[styles.emptyPostsText, { color: colors.textSecondary }]}>
                {t("social.noPostsMessage")}
              </Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {posts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.gridCell}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push(`/community/post/${item.id}` as Href)
                  }
                  testID={`profile-post-${item.id}`}
                >
                  {item.image_url ? (
                    <Image
                      source={{ uri: item.image_url }}
                      style={styles.gridImage}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.gridPlaceholder,
                        { backgroundColor: colors.surface },
                      ]}
                    >
                      <Text
                        style={[styles.gridPlaceholderText, { color: colors.text }]}
                        numberOfLines={3}
                      >
                        {item.meal_name}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      ) : null}

      {user && !showCommunityPosts ? (
        <Text style={[styles.hiddenHint, { color: colors.textSecondary }]}>
          {t("profile.communityPostsHiddenHint")}
        </Text>
      ) : null}

      {showHealth ? (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <Text style={[styles.sectionLabel, { color: colors.primary }]}>
            {t("profile.health")}
          </Text>

          <ProfileInfoRow label={t("profile.age")} value={ageDisplay} colors={colors} />
          <ProfileInfoRow
            label={t("profile.height")}
            value={profile.height.trim() || notSet}
            colors={colors}
          />
          <ProfileInfoRow
            label={t("profile.weight")}
            value={profile.weight.trim() || notSet}
            colors={colors}
          />
        </View>
      ) : null}

      {/* Off-screen share card (photo, name, bio, country, links only) */}
      <View style={styles.offscreen} pointerEvents="none">
        <ProfileShareCard
          ref={shareRef}
          displayName={displayName}
          photoUri={profile.photoUri}
          bio={profile.bio}
          countryLabel={countryDisplay}
          socialLinks={profile.socialLinks}
        />
      </View>
    </ScrollView>
  );
}

function ProfileInfoRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
}) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={[infoRowStyles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[infoRowStyles.value, { color: colors.text }]}>{value}</Text>
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
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      marginBottom: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      letterSpacing: -0.5,
      flex: 1,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    headerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    headerButtonText: {
      fontSize: 13,
      fontWeight: "700",
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 20,
      gap: 14,
      marginBottom: 16,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    avatarContainer: {
      alignSelf: "center",
      marginBottom: 4,
    },
    avatar: {
      width: 110,
      height: 110,
      borderRadius: 55,
    },
    avatarPlaceholder: {
      width: 110,
      height: 110,
      borderRadius: 55,
      alignItems: "center",
      justifyContent: "center",
    },
    displayName: {
      textAlign: "center",
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    profileActionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 8,
    },
    shareProfileBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      minHeight: 36,
      minWidth: 100,
      justifyContent: "center",
    },
    shareProfileText: {
      fontSize: 13,
      fontWeight: "700",
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 4,
    },
    stat: {
      alignItems: "center",
      minWidth: 72,
      gap: 2,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "800",
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
    bio: {
      textAlign: "center",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    countryLine: {
      textAlign: "center",
      fontSize: 14,
      fontWeight: "600",
      marginTop: -4,
    },
    socialList: {
      gap: 8,
      marginTop: 4,
    },
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    socialUrl: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
    },
    signInChip: {
      alignSelf: "center",
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
    },
    signInChipText: {
      fontSize: 14,
      fontWeight: "700",
    },
    postsSection: {
      marginBottom: 16,
      gap: 10,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
    },
    emptyPosts: {
      borderWidth: 1,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
      gap: 10,
    },
    emptyPostsText: {
      fontSize: 14,
      textAlign: "center",
      lineHeight: 20,
      fontWeight: "500",
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: GRID_GAP,
    },
    gridCell: {
      width: GRID_SIZE,
      height: GRID_SIZE,
      borderRadius: 4,
      overflow: "hidden",
    },
    gridImage: {
      width: "100%",
      height: "100%",
    },
    gridPlaceholder: {
      flex: 1,
      padding: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    gridPlaceholderText: {
      fontSize: 11,
      fontWeight: "700",
      textAlign: "center",
    },
    hiddenHint: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: "500",
      textAlign: "center",
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    offscreen: {
      position: "absolute",
      top: 0,
      left: -5000,
      opacity: 0,
    },
  });
}

const infoRowStyles = StyleSheet.create({
  row: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
  },
});
