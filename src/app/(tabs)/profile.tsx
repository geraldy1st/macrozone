import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { getCountryByCode } from "@/data/countries";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  defaultProfile,
  getUserProfile,
  type UserProfile,
} from "@/storage/profile";
import { resetOnboarding } from "@/storage/onboarding";
import type { ThemeColors } from "@/styles/themes";
import { calculateAge } from "@/utils/age";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, isConfigured, signOut } = useAuth();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding();
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
    }, []),
  );

  const selectedCountry = getCountryByCode(profile.countryCode);
  const notSet = t("profile.notSet");

  const handleSignOut = async () => {
    try {
      await signOut();
      await resetOnboarding();
      router.replace("/welcome");
    } catch {
      showToast(t("auth.signOutErrorMessage"), "error");
    }
  };

  const phoneDisplay = profile.phoneNumber.trim()
    ? `${profile.phoneDialCode} ${profile.phoneNumber}`
    : notSet;

  const genderDisplay = profile.gender
    ? t(`profile.genderOptions.${profile.gender}`)
    : notSet;

  const countryDisplay = selectedCountry
    ? `${selectedCountry.flag} ${selectedCountry.name}`
    : notSet;

  const ageValue = calculateAge(profile.birthDate);
  const ageDisplay =
    ageValue !== null ? t("profile.ageYears", { count: ageValue }) : notSet;

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
            style={[styles.headerButton, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
            onPress={() => router.push("/profile-edit" as Href)}
            testID="open-profile-edit-btn"
          >
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Text style={[styles.headerButtonText, { color: colors.accent }]}>
              {t("profile.editButton")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
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

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>
          {t("profile.personalInfo")}
        </Text>

        <View style={styles.avatarContainer}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={42} color={colors.textSecondary} />
            </View>
          )}
        </View>

        {user?.email && (
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
        )}

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

        <ProfileInfoRow
          label={t("profile.name")}
          value={profile.name.trim() || notSet}
          colors={colors}
        />
        <ProfileInfoRow label={t("profile.country")} value={countryDisplay} colors={colors} />
        <ProfileInfoRow label={t("profile.gender")} value={genderDisplay} colors={colors} />
        <ProfileInfoRow label={t("profile.phone")} value={phoneDisplay} colors={colors} />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.sectionLabel, { color: colors.primary }]}>
          {t("profile.health")}
        </Text>

        <ProfileInfoRow
          label={t("profile.age")}
          value={ageDisplay}
          colors={colors}
        />
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

      {user && (
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={[styles.signOutText, { color: colors.alert }]}>
            {t("profile.signOut")}
          </Text>
        </TouchableOpacity>
      )}
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
      <Text style={[infoRowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
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
    email: {
      textAlign: "center",
      fontSize: 14,
      fontWeight: "500",
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
    signOutButton: {
      alignItems: "center",
      paddingVertical: 16,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600",
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