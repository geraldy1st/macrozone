import AppLogo from "@/components/AppLogo";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { setAuthenticatedOnboarding } from "@/storage/onboarding";
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

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const { user, isConfigured, updatePassword } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim() || password.length < 6) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("resetPassword.passwordTooShort"),
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("resetPassword.passwordMismatch"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      await setAuthenticatedOnboarding();
      showToast(t("resetPassword.successMessage"), "success");
      router.replace("/(tabs)");
    } catch {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("resetPassword.errorMessage"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConfigured || !user) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.subtitle}>{t("resetPassword.sessionExpired")}</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace("/forgot-password")}
        >
          <Text style={styles.linkButtonText}>{t("forgotPassword.title")}</Text>
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
          <Text style={styles.title}>{t("resetPassword.title")}</Text>
          <Text style={styles.subtitle}>{t("resetPassword.subtitle")}</Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder={t("resetPassword.newPassword")}
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType="newPassword"
            testID="reset-password-input"
          />
          <TextInput
            style={styles.input}
            placeholder={t("resetPassword.confirmPassword")}
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            textContentType="newPassword"
            testID="reset-password-confirm-input"
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            testID="reset-password-submit-btn"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t("resetPassword.submit")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    linkButton: {
      alignItems: "center",
      padding: 12,
    },
    linkButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}