import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import {
  defaultProfile,
  getUserProfile,
  setUserProfile,
  type UserProfile,
} from "@/storage/profile";
import { resetOnboarding } from "@/storage/onboarding";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, isConfigured, signOut } = useAuth();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getUserProfile().then(setProfile);
    }, []),
  );

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setProfile((current) => ({
        ...current,
        photoUri: result.assets[0].uri,
      }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await setUserProfile(profile);
      showToast(t("profile.savedMessage"), "success");
    } catch {
      showToast(t("profile.saveErrorMessage"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      await resetOnboarding();
      router.replace("/welcome");
    } catch {
      showToast(t("auth.signOutErrorMessage"), "error");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("profile.title")}
        </Text>
        <TouchableOpacity
          style={[styles.settingsButton, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
          onPress={() => router.push("/settings")}
          testID="open-settings-btn"
        >
          <Ionicons name="settings-outline" size={18} color={colors.accent} />
          <Text style={[styles.settingsButtonText, { color: colors.accent }]}>
            {t("profile.openSettings")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <TouchableOpacity style={styles.avatarButton} onPress={handlePickPhoto}>
          {profile.photoUri ? (
            <Image source={{ uri: profile.photoUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
              <Ionicons name="person" size={42} color={colors.textSecondary} />
            </View>
          )}
          <View style={[styles.cameraBadge, { backgroundColor: colors.accent }]}>
            <Ionicons name="camera" size={14} color={colors.background} />
          </View>
        </TouchableOpacity>

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

        <ProfileField
          label={t("profile.name")}
          value={profile.name}
          onChangeText={(name) => setProfile((current) => ({ ...current, name }))}
          colors={colors}
          testID="profile-name-input"
        />
        <ProfileField
          label={t("profile.age")}
          value={profile.age}
          onChangeText={(age) => setProfile((current) => ({ ...current, age }))}
          colors={colors}
          keyboardType="numeric"
          testID="profile-age-input"
        />
        <ProfileField
          label={t("profile.height")}
          value={profile.height}
          onChangeText={(height) => setProfile((current) => ({ ...current, height }))}
          colors={colors}
          keyboardType="numeric"
          testID="profile-height-input"
        />
        <ProfileField
          label={t("profile.weight")}
          value={profile.weight}
          onChangeText={(weight) => setProfile((current) => ({ ...current, weight }))}
          colors={colors}
          keyboardType="numeric"
          testID="profile-weight-input"
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
          onPress={handleSave}
          disabled={isSaving}
          testID="profile-save-btn"
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {t("profile.save")}
          </Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={[styles.signOutText, { color: colors.alert }]}>
              {t("profile.signOut")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

function ProfileField({
  label,
  value,
  onChangeText,
  colors,
  keyboardType = "default",
  testID,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  colors: ThemeColors;
  keyboardType?: "default" | "numeric";
  testID?: string;
}) {
  return (
    <View style={fieldStyles.field}>
      <Text style={[fieldStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        style={[
          fieldStyles.input,
          {
            backgroundColor: colors.surface,
            color: colors.text,
            borderColor: colors.cardBorder,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={colors.textSecondary}
        testID={testID}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 40,
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
    settingsButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    settingsButtonText: {
      fontSize: 13,
      fontWeight: "700",
    },
    card: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 20,
      gap: 14,
    },
    avatarButton: {
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
    cameraBadge: {
      position: "absolute",
      right: 4,
      bottom: 4,
      width: 30,
      height: 30,
      borderRadius: 15,
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
    saveButton: {
      marginTop: 6,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
    },
    signOutButton: {
      alignItems: "center",
      paddingVertical: 8,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600",
    },
  });
}

const fieldStyles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  input: {
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "600",
    borderWidth: 1,
  },
});