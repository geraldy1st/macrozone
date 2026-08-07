import AppLogo from "@/components/AppLogo";
import {
  formatSocialUrlLabel,
  getSocialPlatform,
  type SocialLink,
} from "@/data/socialLinks";
import { macroColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Image,
  StyleSheet,
  Text,
  View,
  type View as ViewType,
} from "react-native";

export type ProfileShareCardProps = {
  displayName: string;
  photoUri?: string | null;
  bio?: string;
  countryLabel?: string | null;
  socialLinks?: SocialLink[];
};

/**
 * Off-screen card for “Share my profile” image export (A010-2).
 * Only public-facing fields: photo, name, bio, country, social links.
 */
const ProfileShareCard = forwardRef<ViewType, ProfileShareCardProps>(
  function ProfileShareCard(
    { displayName, photoUri, bio, countryLabel, socialLinks = [] },
    ref,
  ) {
    const { t } = useTranslation();
    const activeLinks = socialLinks.filter((link) => link.url.trim());

    return (
      <View ref={ref} collapsable={false} style={styles.card}>
        <View style={styles.header}>
          <AppLogo size={36} />
          <Text style={styles.appName}>{t("app.name")}</Text>
        </View>

        <View style={styles.avatarWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#8b8ba0" />
            </View>
          )}
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {displayName}
        </Text>

        {bio?.trim() ? (
          <Text style={styles.bio} numberOfLines={5}>
            {bio.trim()}
          </Text>
        ) : null}

        {countryLabel ? (
          <Text style={styles.country} numberOfLines={1}>
            {countryLabel}
          </Text>
        ) : null}

        {activeLinks.length > 0 ? (
          <View style={styles.links}>
            {activeLinks.slice(0, 6).map((link) => {
              const platform = getSocialPlatform(link.platform);
              if (!platform) {
                return null;
              }
              return (
                <View key={`${link.platform}-${link.url}`} style={styles.linkRow}>
                  <Ionicons name={platform.icon} size={16} color={macroColors.accent} />
                  <Text style={styles.linkText} numberOfLines={1}>
                    {formatSocialUrlLabel(link.url)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.footer}>{t("share.footer")}</Text>
      </View>
    );
  },
);

export default ProfileShareCard;

const styles = StyleSheet.create({
  card: {
    width: 360,
    backgroundColor: "#16162a",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 10,
    marginBottom: 4,
  },
  appName: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  avatarWrap: {
    marginTop: 4,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarPlaceholder: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#2a2a40",
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    maxWidth: "100%",
  },
  bio: {
    color: "#d8deea",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "500",
  },
  country: {
    color: "#a8b0c0",
    fontSize: 14,
    fontWeight: "600",
  },
  links: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#1e1e35",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  linkText: {
    color: "#e8ecf4",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  footer: {
    color: "#8b8ba0",
    fontSize: 12,
    marginTop: 8,
  },
});
