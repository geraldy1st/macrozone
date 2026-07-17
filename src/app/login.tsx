import AppLogo from "@/components/AppLogo";
import PasswordInput from "@/components/PasswordInput";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { setAuthenticatedOnboarding, setGuestOnboarding } from "@/storage/onboarding";
import { getAuthErrorCode } from "@/utils/authErrors";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const { isConfigured, signInWithEmail } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeAuth = async () => {
    await setAuthenticatedOnboarding();
    router.replace("/(tabs)");
  };

  const handleEmailAuth = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim()) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("auth.missingCredentials"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await signInWithEmail(trimmedEmail, password);
      await completeAuth();
    } catch (error) {
      const errorCode = getAuthErrorCode(error);

      if (errorCode === "EMAIL_NOT_CONFIRMED") {
        router.replace({
          pathname: "/verify-email",
          params: { email: trimmedEmail },
        });
        return;
      }

      showAlert({
        title: t("auth.errorTitle"),
        message: t("auth.signInErrorMessage"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConfigured) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AppLogo size={64} />
        <Text style={styles.title}>{t("auth.notConfiguredTitle")}</Text>
        <Text style={styles.subtitle}>{t("auth.notConfiguredMessage")}</Text>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>{t("auth.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <AppLogo size={72} />
          <Text style={styles.title}>{t("auth.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.subtitle")}</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder={t("auth.email")}
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            testID="auth-email-input"
          />
          <PasswordInput
            placeholder={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            textContentType="password"
            testID="auth-password-input"
          />

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => router.push("/forgot-password")}
            testID="auth-forgot-password-btn"
          >
            <Text style={styles.forgotPasswordText}>{t("auth.forgotPassword")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleEmailAuth}
            disabled={isSubmitting}
            testID="auth-submit-btn"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>{t("auth.signIn")}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => router.replace("/signup")}
            testID="auth-go-signup-btn"
          >
            <Text style={styles.switchModeText}>{t("auth.needAccount")}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.guestButton}
          onPress={async () => {
            await setGuestOnboarding();
            router.replace("/(tabs)");
          }}
          testID="auth-guest-btn"
        >
          <Text style={styles.guestButtonText}>{t("auth.continueAsGuest")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    },
    centered: {
      justifyContent: "center",
      alignItems: "center",
      gap: 16,
    },
    hero: {
      alignItems: "center",
      marginTop: 20,
      marginBottom: 28,
      gap: 12,
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
      paddingHorizontal: 12,
    },
    formCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 12,
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 16,
      borderRadius: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    primaryButton: {
      backgroundColor: colors.accent,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 4,
      minHeight: 52,
      justifyContent: "center",
    },
    primaryButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: "700",
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    switchModeButton: {
      alignItems: "center",
      paddingVertical: 4,
    },
    switchModeText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    forgotPasswordButton: {
      alignSelf: "flex-end",
      paddingVertical: 2,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    guestButton: {
      alignItems: "center",
      marginTop: 24,
      padding: 12,
    },
    guestButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
    },
    secondaryButton: {
      marginTop: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    secondaryButtonText: {
      color: colors.text,
      fontWeight: "600",
    },
  });
}
