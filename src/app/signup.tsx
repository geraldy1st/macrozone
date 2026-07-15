import AppLogo from "@/components/AppLogo";
import PasswordInput from "@/components/PasswordInput";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { setAuthenticatedOnboarding } from "@/storage/onboarding";
import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const { showToast } = useToast();
  const { isConfigured, signUpWithEmail, signInWithEmail } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password.trim() || !confirmPassword.trim()) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("signup.missingFields"),
      });
      return;
    }

    if (password.length < 6) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("signup.passwordTooShort"),
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("signup.passwordMismatch"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUpWithEmail(trimmedEmail, password);

      if (!result.sessionCreated) {
        await signInWithEmail(trimmedEmail, password);
      }

      await setAuthenticatedOnboarding();
      showToast(t("signup.welcomeMessage"), "success");
      router.replace("/profile-edit" as Href);
    } catch (error) {
      if (error instanceof Error && error.message === "EMAIL_ALREADY_REGISTERED") {
        showAlert({
          title: t("auth.errorTitle"),
          message: t("auth.emailAlreadyRegistered"),
        });
        return;
      }

      showAlert({
        title: t("auth.errorTitle"),
        message: t("auth.signUpErrorMessage"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isConfigured) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.title}>{t("auth.notConfiguredTitle")}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.linkText}>{t("auth.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.hero}>
          <AppLogo size={72} />
          <Text style={styles.title}>{t("signup.title")}</Text>
          <Text style={styles.subtitle}>{t("signup.subtitle")}</Text>
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
            testID="signup-email-input"
          />

          <PasswordInput
            placeholder={t("auth.password")}
            value={password}
            onChangeText={setPassword}
            textContentType="newPassword"
            testID="signup-password-input"
          />

          <PasswordInput
            placeholder={t("signup.confirmPassword")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textContentType="newPassword"
            testID="signup-confirm-password-input"
          />

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isSubmitting}
            testID="signup-submit-btn"
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.primaryButtonText}>{t("auth.createAccount")}</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace("/login")}
        >
          <Text style={styles.linkText}>{t("auth.haveAccount")}</Text>
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
      flexGrow: 1,
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
    linkText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: "600",
    },
  });
}