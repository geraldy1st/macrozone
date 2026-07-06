import AppLogo from "@/components/AppLogo";
import { useTheme } from "@/contexts/ThemeContext";
import { setGuestOnboarding } from "@/storage/onboarding";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleGuest = async () => {
    await setGuestOnboarding();
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <AppLogo size={88} />
        <Text style={styles.title}>{t("welcome.title")}</Text>
        <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/login")}
          testID="welcome-sign-in-btn"
        >
          <Ionicons name="log-in-outline" size={20} color={colors.background} />
          <Text style={styles.primaryButtonText}>{t("welcome.signIn")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.push("/login?mode=signup")}
          testID="welcome-sign-up-btn"
        >
          <Ionicons name="person-add-outline" size={20} color={colors.accent} />
          <Text style={styles.secondaryButtonText}>{t("welcome.signUp")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={handleGuest}
          testID="welcome-guest-btn"
        >
          <Text style={styles.guestButtonText}>{t("welcome.continueGuest")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingTop: 90,
      paddingBottom: 40,
      justifyContent: "space-between",
    },
    hero: {
      alignItems: "center",
      gap: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 12,
    },
    actions: {
      gap: 12,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.accent,
      padding: 18,
      borderRadius: 14,
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.card,
      padding: 18,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    secondaryButtonText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: "700",
    },
    guestButton: {
      alignItems: "center",
      paddingVertical: 16,
    },
    guestButtonText: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}