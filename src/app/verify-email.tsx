import AppLogo from "@/components/AppLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { resendConfirmationEmail } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [isResending, setIsResending] = useState(false);

  const displayEmail = typeof email === "string" ? email : "";

  const handleOpenMail = async () => {
    const url = Platform.select({
      ios: "message://",
      android: "mailto:",
      default: "mailto:",
    });

    if (!url) {
      return;
    }

    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      showToast(t("verifyEmail.openMailUnavailable"), "info");
    }
  };

  const handleResend = async () => {
    if (!displayEmail) {
      showToast(t("verifyEmail.missingEmail"), "error");
      return;
    }

    setIsResending(true);

    try {
      await resendConfirmationEmail(displayEmail);
      showToast(t("verifyEmail.resendSuccess"), "success");
    } catch {
      showToast(t("verifyEmail.resendError"), "error");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <AppLogo size={72} />
        <View style={[styles.iconBadge, { backgroundColor: colors.surface }]}>
          <Ionicons name="mail-unread-outline" size={34} color={colors.primary} />
        </View>
        <Text style={styles.title}>{t("verifyEmail.title")}</Text>
        <Text style={styles.subtitle}>{t("verifyEmail.subtitle")}</Text>
        {displayEmail ? (
          <Text style={styles.email}>{displayEmail}</Text>
        ) : null}
      </View>

      <View style={[styles.card, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}>
        <StepItem
          number="1"
          text={t("verifyEmail.stepInbox")}
          colors={colors}
        />
        <StepItem
          number="2"
          text={t("verifyEmail.stepSpam")}
          colors={colors}
        />
        <StepItem
          number="3"
          text={t("verifyEmail.stepConfirm")}
          colors={colors}
        />
      </View>

      <Text style={styles.note}>{t("verifyEmail.oauthNote")}</Text>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleOpenMail}
        testID="verify-email-open-mail-btn"
      >
        <Ionicons name="mail-outline" size={20} color={colors.background} />
        <Text style={styles.primaryButtonText}>{t("verifyEmail.openMail")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
        onPress={handleResend}
        disabled={isResending || !displayEmail}
        testID="verify-email-resend-btn"
      >
        {isResending ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.secondaryButtonText}>{t("verifyEmail.resend")}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.replace("/login")}
        testID="verify-email-sign-in-btn"
      >
        <Text style={styles.linkButtonText}>{t("verifyEmail.goToSignIn")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StepItem({
  number,
  text,
  colors,
}: {
  number: string;
  text: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View style={stepStyles.row}>
      <View style={[stepStyles.badge, { backgroundColor: colors.surface }]}>
        <Text style={[stepStyles.badgeText, { color: colors.accent }]}>{number}</Text>
      </View>
      <Text style={[stepStyles.text, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: 60,
      paddingHorizontal: 20,
    },
    content: {
      paddingBottom: 40,
      gap: 16,
    },
    hero: {
      alignItems: "center",
      gap: 12,
      marginBottom: 8,
    },
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginTop: -8,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 8,
    },
    email: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.primary,
      textAlign: "center",
    },
    card: {
      borderRadius: 16,
      borderWidth: 1,
      padding: 18,
      gap: 14,
    },
    note: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 8,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 12,
      minHeight: 52,
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "700",
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      minHeight: 52,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "600",
    },
    linkButton: {
      alignItems: "center",
      paddingVertical: 12,
    },
    linkButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "800",
  },
  text: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
});