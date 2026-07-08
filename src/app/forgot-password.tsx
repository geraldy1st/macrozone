import AppLogo from "@/components/AppLogo";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { Ionicons } from "@expo/vector-icons";
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

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const { isConfigured, resetPasswordForEmail } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("forgotPassword.missingEmail"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPasswordForEmail(trimmedEmail);
      showToast(t("forgotPassword.successMessage"), "success");
      router.replace("/login");
    } catch {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("forgotPassword.errorMessage"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConfigured) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.title}>{t("auth.notConfiguredTitle")}</Text>
        <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
          <Text style={styles.linkButtonText}>{t("auth.back")}</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <AppLogo size={72} />
          <Text style={styles.title}>{t("forgotPassword.title")}</Text>
          <Text style={styles.subtitle}>{t("forgotPassword.subtitle")}</Text>
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
            testID="forgot-password-email-input"
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            testID="forgot-password-submit-btn"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {t("forgotPassword.submit")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.linkButtonText}>{t("forgotPassword.backToSignIn")}</Text>
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
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
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
      marginTop: 24,
      padding: 12,
    },
    linkButtonText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}