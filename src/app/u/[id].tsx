import ProfileAvatar from "@/components/ProfileAvatar";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { getCountryByCode } from "@/data/countries";
import {
  buildSocialUrl,
  formatSocialUrlLabel,
  getSocialPlatform,
  type SocialPlatform,
} from "@/data/socialLinks";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useMyAvatarUri } from "@/hooks/useMyAvatarUri";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  blockUser,
  fetchPostsByAuthor,
  getPublicProfileView,
  toggleFollow,
  unblockUser,
} from "@/services/community";
import { hideUser } from "@/storage/hiddenUsers";
import type { CommunityProfile, FeedPost } from "@/types/community";
import type { ThemeColors } from "@/styles/themes";
import { resolveAuthorAvatarUri } from "@/utils/avatar";
import { isUserOnline } from "@/utils/presence";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, useLocalSearchParams, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const GRID_GAP = 2;
const GRID_COLS = 3;
const GRID_SIZE =
  (Dimensions.get("window").width - 40 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

/**
 * Public profile: macrozone://u/{userId}
 * A011-2: bio, country, links, share, ⋮ menu (block / hide / report / share).
 */
export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding(20, false);
  const { myAvatarUri } = useMyAvatarUri();

  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      const view = await getPublicProfileView(id, user?.id ?? null);
      if (!view) {
        setProfile(null);
        setError(true);
        setPosts([]);
        return;
      }

      setProfile(view.profile);
      setIsFollowing(view.isFollowing);
      setIsBlocked(view.isBlocked);
      setIsSelf(view.isSelf);

      const postsVisible =
        view.isSelf || view.profile.show_community_posts !== false;

      if (!view.isBlocked) {
        const page = await fetchPostsByAuthor(id, { limit: 30 });
        setPostCount(page.posts.length);
        setPosts(postsVisible ? page.posts : []);
      } else {
        setPosts([]);
        setPostCount(0);
      }
    } catch {
      setError(true);
      setProfile(null);
      setPosts([]);
      setPostCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [id, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const displayName =
    profile?.display_name?.trim() || t("profile.displayNameFallback");
  const online = isUserOnline(profile?.last_seen_at);
  const followers = profile?.followers_count ?? 0;
  const following = profile?.following_count ?? 0;
  const country = profile?.country_code
    ? getCountryByCode(profile.country_code)
    : null;
  const countryDisplay = country
    ? `${country.flag} ${country.name}`
    : null;
  const bio = profile?.bio?.trim() ?? "";
  const socialLinks = (profile?.social_links ?? []).filter((l) => l.url.trim());

  const requireAuth = (message: string) => {
    showAlert({
      title: t("community.authRequiredTitle"),
      message,
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        { text: t("auth.signIn"), onPress: () => router.push("/login") },
      ],
    });
  };

  const handleShareProfile = async () => {
    if (!profile) {
      return;
    }
    const shareUrl = `macrozone://u/${profile.id}`;
    const message = t("profile.shareMessage", {
      name: displayName,
      url: shareUrl,
    });
    try {
      await Share.share({
        message: `${message}\n${shareUrl}`,
        title: t("profile.shareTitle"),
        url: shareUrl,
      });
    } catch {
      showToast(t("profile.shareError"), "error");
    }
  };

  const handleFollow = async () => {
    if (!user || !profile) {
      requireAuth(t("social.authRequiredFollow"));
      return;
    }

    setIsActionLoading(true);
    const prev = isFollowing;
    const next = !prev;
    setIsFollowing(next);
    setProfile((p) =>
      p
        ? {
            ...p,
            followers_count: Math.max(0, (p.followers_count ?? 0) + (next ? 1 : -1)),
          }
        : p,
    );

    try {
      await toggleFollow(user.id, profile.id, prev);
    } catch {
      setIsFollowing(prev);
      setProfile((p) =>
        p
          ? {
              ...p,
              followers_count: Math.max(
                0,
                (p.followers_count ?? 0) + (prev ? 1 : -1),
              ),
            }
          : p,
      );
      showToast(t("social.followError"), "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBlock = () => {
    if (!user || !profile) {
      requireAuth(t("social.authRequiredBlock"));
      return;
    }

    setMenuOpen(false);
    showAlert({
      title: t("social.blockTitle"),
      message: t("social.blockMessage", { name: displayName }),
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        {
          text: t("social.blockConfirm"),
          style: "destructive",
          onPress: async () => {
            setIsActionLoading(true);
            try {
              await blockUser(user.id, profile.id);
              setIsBlocked(true);
              setIsFollowing(false);
              setPosts([]);
              showToast(t("social.blockSuccess"), "success");
            } catch {
              showToast(t("social.blockError"), "error");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ],
    });
  };

  const handleHide = () => {
    if (!user || !profile) {
      requireAuth(t("social.authRequiredHide"));
      return;
    }
    setMenuOpen(false);
    showAlert({
      title: t("social.hideTitle"),
      message: t("social.hideMessage", { name: displayName }),
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        {
          text: t("social.hideConfirm"),
          style: "destructive",
          onPress: async () => {
            try {
              await hideUser(profile.id);
              showToast(t("social.hideSuccess"), "success");
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(tabs)/community" as Href);
              }
            } catch {
              showToast(t("social.hideError"), "error");
            }
          },
        },
      ],
    });
  };

  const handleReport = () => {
    setMenuOpen(false);
    showAlert({
      title: t("social.reportTitle"),
      message: t("social.reportMessage", { name: displayName }),
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        {
          text: t("social.reportConfirm"),
          onPress: () => {
            showToast(t("social.reportSuccess"), "success");
          },
        },
      ],
    });
  };

  const handleUnblock = async () => {
    if (!user || !profile) {
      return;
    }

    setIsActionLoading(true);
    try {
      await unblockUser(user.id, profile.id);
      setIsBlocked(false);
      showToast(t("social.unblockSuccess"), "success");
      void load();
    } catch {
      showToast(t("social.unblockError"), "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {t("profile.publicTitle")}
        </Text>
        {!isSelf && profile && !error ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setMenuOpen(true)}
            testID="public-profile-menu-btn"
            accessibilityLabel={t("social.moreOptions")}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButton} />
        )}
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
        <FlatList
          data={isBlocked ? [] : posts}
          keyExtractor={(item) => item.id}
          numColumns={GRID_COLS}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={{ paddingBottom: bottomPadding }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerBlock}>
              <View
                style={[
                  styles.card,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
              >
                <View style={styles.avatarWrap}>
                  <ProfileAvatar
                    uri={resolveAuthorAvatarUri({
                      authorId: profile.id,
                      remoteUri: profile.avatar_url,
                      myUserId: user?.id,
                      myAvatarUri,
                    })}
                    name={displayName}
                    size={110}
                    backgroundColor={colors.surface}
                    textColor={colors.textSecondary}
                  />
                  {online && !isBlocked ? (
                    <View
                      style={[styles.onlineDot, { borderColor: colors.card }]}
                      testID="public-profile-online-dot"
                    />
                  ) : null}
                </View>

                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {displayName}
                </Text>

                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {postCount}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {t("social.posts")}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {followers}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {t("social.followers")}
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {following}
                    </Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {t("social.following")}
                    </Text>
                  </View>
                </View>

                {bio && !isBlocked ? (
                  <Text style={[styles.bio, { color: colors.textSecondary }]}>
                    {bio}
                  </Text>
                ) : null}

                {countryDisplay && !isBlocked ? (
                  <Text style={[styles.country, { color: colors.textSecondary }]}>
                    {countryDisplay}
                  </Text>
                ) : null}

                {socialLinks.length > 0 && !isBlocked ? (
                  <View style={styles.socialList}>
                    {socialLinks.map((link) => {
                      const platform = getSocialPlatform(
                        link.platform as SocialPlatform,
                      );
                      if (!platform) {
                        return null;
                      }
                      const openUrl = buildSocialUrl(
                        link.platform as SocialPlatform,
                        link.url,
                      );
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
                          testID={`public-profile-social-${link.platform}`}
                        >
                          <Ionicons
                            name={platform.icon}
                            size={18}
                            color={colors.accent}
                          />
                          <Text
                            style={[styles.socialUrl, { color: colors.primary }]}
                            numberOfLines={1}
                          >
                            {formatSocialUrlLabel(link.url)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                {isSelf ? (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        styles.actionFlex,
                        { backgroundColor: colors.accent },
                      ]}
                      onPress={() => router.push("/profile-edit" as Href)}
                      testID="public-profile-edit-btn"
                    >
                      <Text style={[styles.primaryBtnText, { color: colors.background }]}>
                        {t("profile.editButton")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.iconBtn,
                        { borderColor: colors.cardBorder, backgroundColor: colors.surface },
                      ]}
                      onPress={() => void handleShareProfile()}
                      testID="public-profile-share-btn"
                      accessibilityLabel={t("profile.shareButton")}
                    >
                      <Ionicons name="share-outline" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                ) : isBlocked ? (
                  <TouchableOpacity
                    style={[styles.secondaryBtn, { borderColor: colors.cardBorder }]}
                    onPress={() => void handleUnblock()}
                    disabled={isActionLoading}
                    testID="public-profile-unblock-btn"
                  >
                    <Text style={[styles.secondaryBtnText, { color: colors.text }]}>
                      {t("social.unblock")}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.primaryBtn,
                        styles.actionFlex,
                        {
                          backgroundColor: isFollowing
                            ? colors.surface
                            : colors.accent,
                          borderWidth: isFollowing ? 1 : 0,
                          borderColor: colors.cardBorder,
                        },
                      ]}
                      onPress={() => void handleFollow()}
                      disabled={isActionLoading}
                      testID="public-profile-follow-btn"
                    >
                      <Text
                        style={[
                          styles.primaryBtnText,
                          {
                            color: isFollowing ? colors.text : colors.background,
                          },
                        ]}
                      >
                        {isFollowing ? t("social.unfollow") : t("social.follow")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.iconBtn,
                        { borderColor: colors.cardBorder, backgroundColor: colors.surface },
                      ]}
                      onPress={() => void handleShareProfile()}
                      disabled={isActionLoading}
                      testID="public-profile-share-btn"
                      accessibilityLabel={t("profile.shareButton")}
                    >
                      <Ionicons name="share-outline" size={20} color={colors.accent} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {isBlocked ? (
                <Text style={[styles.blockedHint, { color: colors.textSecondary }]}>
                  {t("social.blockedProfileHint")}
                </Text>
              ) : profile.show_community_posts === false && !isSelf ? (
                <Text style={[styles.blockedHint, { color: colors.textSecondary }]}>
                  {t("social.postsHiddenByUser")}
                </Text>
              ) : (
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {t("social.communityPosts")}
                </Text>
              )}
            </View>
          }
          ListEmptyComponent={
            !isBlocked && (isSelf || profile.show_community_posts !== false) ? (
              <View style={styles.centered}>
                <Ionicons
                  name="images-outline"
                  size={36}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  {t("social.noPostsTitle")}
                </Text>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {t("social.noPostsMessage")}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridCell}
              activeOpacity={0.85}
              onPress={() =>
                router.push(`/community/post/${item.id}` as Href)
              }
              testID={`public-profile-post-${item.id}`}
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
          )}
        />
      )}

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View
            style={[
              styles.menuSheet,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <MenuRow
              icon="ban-outline"
              label={t("social.block")}
              color={colors.alert}
              onPress={handleBlock}
              testID="public-profile-menu-block"
            />
            <MenuRow
              icon="eye-off-outline"
              label={t("social.hide")}
              color={colors.text}
              onPress={handleHide}
              testID="public-profile-menu-hide"
            />
            <MenuRow
              icon="flag-outline"
              label={t("social.report")}
              color={colors.text}
              onPress={handleReport}
              testID="public-profile-menu-report"
            />
            <MenuRow
              icon="share-outline"
              label={t("profile.shareButton")}
              color={colors.text}
              onPress={() => {
                setMenuOpen(false);
                void handleShareProfile();
              }}
              testID="public-profile-menu-share"
            />
            <TouchableOpacity
              style={styles.menuCancel}
              onPress={() => setMenuOpen(false)}
            >
              <Text style={[styles.menuCancelText, { color: colors.textSecondary }]}>
                {t("mealItem.cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuRow({
  icon,
  label,
  color,
  onPress,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity style={menuRowStyles.row} onPress={onPress} testID={testID}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[menuRowStyles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const menuRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});

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
    headerBlock: {
      marginBottom: 8,
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 20,
      alignItems: "center",
      gap: 12,
      marginBottom: 18,
    },
    avatarWrap: {
      position: "relative",
    },
    onlineDot: {
      position: "absolute",
      right: 6,
      bottom: 6,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: "#22c55e",
      borderWidth: 2,
    },
    name: {
      fontSize: 22,
      fontWeight: "800",
      maxWidth: "100%",
    },
    statsRow: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-around",
      marginTop: 4,
      marginBottom: 4,
    },
    stat: {
      alignItems: "center",
      minWidth: 72,
    },
    statValue: {
      fontSize: 18,
      fontWeight: "800",
    },
    statLabel: {
      fontSize: 12,
      fontWeight: "600",
      marginTop: 2,
    },
    bio: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      textAlign: "center",
      width: "100%",
    },
    country: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    socialList: {
      width: "100%",
      gap: 8,
    },
    socialRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    socialUrl: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
    },
    actionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      width: "100%",
    },
    actionFlex: {
      flex: 1,
    },
    primaryBtn: {
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      minWidth: 140,
    },
    primaryBtnText: {
      fontSize: 15,
      fontWeight: "700",
    },
    secondaryBtn: {
      borderWidth: 1,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: "center",
      minWidth: 140,
    },
    secondaryBtnText: {
      fontSize: 15,
      fontWeight: "700",
    },
    iconBtn: {
      width: 46,
      height: 46,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      marginBottom: 10,
    },
    blockedHint: {
      fontSize: 14,
      textAlign: "center",
      fontWeight: "500",
      lineHeight: 20,
      marginTop: 8,
    },
    gridRow: {
      gap: GRID_GAP,
      marginBottom: GRID_GAP,
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
    centered: {
      alignItems: "center",
      gap: 10,
      marginTop: 32,
      paddingHorizontal: 16,
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
    menuOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "flex-end",
    },
    menuSheet: {
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 28,
      gap: 2,
    },
    menuCancel: {
      marginTop: 8,
      paddingVertical: 14,
      alignItems: "center",
    },
    menuCancelText: {
      fontSize: 15,
      fontWeight: "600",
    },
  });
}
