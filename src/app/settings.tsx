import { changeAppLanguage } from "@/i18n";
import {
  defaultMacroGoals,
  getMacroGoals,
  setMacroGoals,
  type MacroGoals,
} from "@/storage/goals";
import {
  type AppLanguage,
  supportedLanguages,
} from "@/storage/settings";
import PasswordInput from "@/components/PasswordInput";
import { useAlert } from "@/contexts/AlertContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { resetOnboarding } from "@/storage/onboarding";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { scopedKey } from "@/storage/scopedKey";
import type { ThemeColors, ThemeMode } from "@/styles/themes";
import { getAuthErrorCode } from "@/utils/authErrors";
import { DeleteAccountError } from "@/utils/deleteAccount";
import {
  cancelMealReminders,
  scheduleMealReminders,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function getRemindersKey() {
  return scopedKey("remindersEnabled");
}

const languageLabels: Record<AppLanguage, string> = {
  en: "settings.english",
  fr: "settings.french",
  es: "settings.spanish",
};

const goalFields: { key: keyof MacroGoals; labelKey: string }[] = [
  { key: "calories", labelKey: "settings.goals.calories" },
  { key: "protein", labelKey: "settings.goals.protein" },
  { key: "carbs", labelKey: "settings.goals.carbs" },
  { key: "fat", labelKey: "settings.goals.fat" },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { colors, mode, setMode } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const {
    user,
    deleteAccount,
    changePassword,
    changeEmail,
    canChangeEmailWithPassword,
  } = useAuth();
  const styles = useThemedStyles(createStyles);
  // Extra room so legal links stay above Android system nav (A009-1).
  const bottomPadding = useBottomContentPadding(48, false);
  const currentLanguage =
    (supportedLanguages.find((language) => i18n.language.startsWith(language)) ??
      "en") as AppLanguage;
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [goals, setGoals] = useState<Record<keyof MacroGoals, string>>({
    calories: String(defaultMacroGoals.calories),
    protein: String(defaultMacroGoals.protein),
    carbs: String(defaultMacroGoals.carbs),
    fat: String(defaultMacroGoals.fat),
  });

  useFocusEffect(
    useCallback(() => {
      getMacroGoals().then((storedGoals) => {
        setGoals({
          calories: String(storedGoals.calories),
          protein: String(storedGoals.protein),
          carbs: String(storedGoals.carbs),
          fat: String(storedGoals.fat),
        });
      });
    }, []),
  );

  const handleLanguageChange = async (language: AppLanguage) => {
    if (language === currentLanguage) {
      return;
    }

    await changeAppLanguage(language);

    const remindersEnabled = await AsyncStorage.getItem(getRemindersKey());
    if (remindersEnabled === "true") {
      await cancelMealReminders();
      await scheduleMealReminders();
    }
  };

  const handleThemeChange = async (nextMode: ThemeMode) => {
    if (nextMode === mode) {
      return;
    }

    await setMode(nextMode);
    showToast(
      t(`settings.theme.${nextMode}Enabled`),
      "info",
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("settings.password.missingFields"),
      });
      return;
    }

    if (newPassword.length < 6) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("resetPassword.passwordTooShort"),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("resetPassword.passwordMismatch"),
      });
      return;
    }

    setIsChangingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast(t("settings.password.success"), "success");
    } catch {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("settings.password.error"),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!canChangeEmailWithPassword) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("settings.email.oauthOnly"),
      });
      return;
    }

    if (!newEmail.trim() || !emailPassword.trim()) {
      showAlert({
        title: t("auth.errorTitle"),
        message: t("settings.email.missingFields"),
      });
      return;
    }

    setIsChangingEmail(true);

    try {
      await changeEmail(newEmail, emailPassword);
      setNewEmail("");
      setEmailPassword("");
      setShowEmailForm(false);
      showAlert({
        title: t("settings.email.successTitle"),
        message: t("settings.email.successMessage"),
      });
    } catch (error) {
      const code = getAuthErrorCode(error);
      let message = t("settings.email.error");

      if (code === "EMAIL_INVALID") {
        message = t("settings.email.invalid");
      } else if (code === "EMAIL_UNCHANGED") {
        message = t("settings.email.unchanged");
      } else if (code === "EMAIL_CHANGE_OAUTH_ONLY") {
        message = t("settings.email.oauthOnly");
      } else if (code === "EMAIL_ALREADY_REGISTERED") {
        message = t("settings.email.alreadyUsed");
      } else if (code === "EMAIL_PASSWORD_REQUIRED") {
        message = t("settings.email.missingFields");
      }

      showAlert({
        title: t("auth.errorTitle"),
        message,
      });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleDeleteAccount = () => {
    showAlert({
      title: t("settings.account.deleteTitle"),
      message: t("settings.account.deleteMessage"),
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        {
          text: t("settings.account.deleteConfirm"),
          style: "destructive",
          onPress: async () => {
            setIsDeletingAccount(true);

            try {
              await deleteAccount();
              await resetOnboarding();
              showToast(t("settings.account.deleteSuccess"), "success");
              // Sign-in screen (with continue as guest), not Welcome.
              router.replace("/login");
            } catch (error) {
              const message =
                error instanceof DeleteAccountError && error.code === "NOT_CONFIGURED"
                  ? t("settings.account.deleteNotConfigured")
                  : error instanceof DeleteAccountError && error.code === "UNAUTHORIZED"
                    ? t("settings.account.deleteUnauthorized")
                    : t("settings.account.deleteError");

              showAlert({
                title: t("auth.errorTitle"),
                message,
              });
            } finally {
              setIsDeletingAccount(false);
            }
          },
        },
      ],
    });
  };

  const handleSaveGoals = async () => {
    const parsedGoals: MacroGoals = {
      calories: Number(goals.calories) || defaultMacroGoals.calories,
      protein: Number(goals.protein) || defaultMacroGoals.protein,
      carbs: Number(goals.carbs) || defaultMacroGoals.carbs,
      fat: Number(goals.fat) || defaultMacroGoals.fat,
    };

    await setMacroGoals(parsedGoals);
    showToast(t("settings.goals.savedMessage"), "success");
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPadding }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("settings.title")}</Text>
        <View style={styles.backButton} />
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("settings.theme.title")}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {t("settings.theme.description")}
      </Text>

      <View style={styles.options}>
        {(["system", "dark", "light"] as ThemeMode[]).map((themeMode) => {
          const isSelected = mode === themeMode;

          return (
            <TouchableOpacity
              key={themeMode}
              style={[
                styles.option,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.accent : colors.cardBorder,
                },
                isSelected && { backgroundColor: colors.surface },
              ]}
              onPress={() => handleThemeChange(themeMode)}
              testID={`theme-${themeMode}`}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? colors.accent : colors.text },
                ]}
              >
                {t(`settings.theme.${themeMode}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("settings.language")}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {t("settings.languageDescription")}
      </Text>

      <View style={styles.options}>
        {supportedLanguages.map((language) => {
          const isSelected = currentLanguage === language;

          return (
            <TouchableOpacity
              key={language}
              style={[
                styles.option,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.accent : colors.cardBorder,
                },
                isSelected && { backgroundColor: colors.surface },
              ]}
              onPress={() => handleLanguageChange(language)}
              testID={`language-${language}`}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: isSelected ? colors.accent : colors.text },
                ]}
              >
                {t(languageLabels[language])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("settings.goals.title")}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {t("settings.goals.description")}
      </Text>

      <View
        style={[
          styles.goalsCard,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        {goalFields.map(({ key, labelKey }) => (
          <View key={key} style={styles.goalField}>
            <Text style={[styles.goalLabel, { color: colors.textSecondary }]}>
              {t(labelKey)}
            </Text>
            <TextInput
              style={[
                styles.goalInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                },
              ]}
              value={goals[key]}
              onChangeText={(value) =>
                setGoals((current) => ({ ...current, [key]: value }))
              }
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.accent }]}
          onPress={handleSaveGoals}
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {t("settings.goals.save")}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t("settings.account.title")}
      </Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>
        {user
          ? t("settings.account.sectionDescription")
          : t("settings.account.guestDescription")}
      </Text>

      {!user ? (
        <TouchableOpacity
          style={[styles.signInAccountBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push("/login")}
          testID="account-sign-in-btn"
        >
          <Text style={[styles.saveButtonText, { color: colors.background }]}>
            {t("auth.signIn")}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.accountMenu}>
            <AccountRow
              icon="create-outline"
              label={t("settings.account.editProfile")}
              colors={colors}
              onPress={() => router.push("/profile-edit" as Href)}
              testID="account-edit-profile-btn"
            />
            <AccountRow
              icon="mail-outline"
              label={t("settings.email.title")}
              colors={colors}
              onPress={() => {
                if (!canChangeEmailWithPassword) {
                  showAlert({
                    title: t("settings.email.title"),
                    message: t("settings.email.oauthOnly"),
                  });
                  return;
                }
                setShowEmailForm((current) => !current);
                setShowPasswordForm(false);
              }}
              testID="account-change-email-btn"
              trailing={user.email ?? undefined}
            />
            <AccountRow
              icon="key-outline"
              label={t("settings.password.title")}
              colors={colors}
              onPress={() => {
                setShowPasswordForm((current) => !current);
                setShowEmailForm(false);
              }}
              testID="account-change-password-btn"
            />
            <AccountRow
              icon="card-outline"
              label={t("settings.account.manageSubscription")}
              colors={colors}
              onPress={() =>
                showToast(t("settings.account.subscriptionComingSoon"), "info")
              }
              testID="account-subscription-btn"
              trailing={t("settings.account.comingSoon")}
            />
            <AccountRow
              icon="ban-outline"
              label={t("social.blockedUsers")}
              colors={colors}
              onPress={() => router.push("/users/blocked" as Href)}
              testID="account-blocked-users-btn"
            />
          </View>

          {showEmailForm && canChangeEmailWithPassword ? (
            <View
              style={[
                styles.passwordCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.description, { color: colors.textSecondary, marginBottom: 0 }]}>
                {t("settings.email.description")}
              </Text>
              <Text style={[styles.currentEmail, { color: colors.text }]}>
                {t("settings.email.current", { email: user.email })}
              </Text>
              <TextInput
                style={[
                  styles.emailInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text,
                    borderColor: colors.cardBorder,
                  },
                ]}
                placeholder={t("settings.email.next")}
                placeholderTextColor={colors.textSecondary}
                value={newEmail}
                onChangeText={setNewEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoCorrect={false}
                testID="settings-new-email"
              />
              <PasswordInput
                placeholder={t("settings.email.passwordConfirm")}
                value={emailPassword}
                onChangeText={setEmailPassword}
                textContentType="password"
                testID="settings-email-password"
              />
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.accent },
                  isChangingEmail && styles.deleteButtonDisabled,
                ]}
                onPress={() => void handleChangeEmail()}
                disabled={isChangingEmail}
                testID="settings-change-email-btn"
              >
                {isChangingEmail ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: colors.background }]}>
                    {t("settings.email.submit")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          {showPasswordForm ? (
            <View
              style={[
                styles.passwordCard,
                { backgroundColor: colors.card, borderColor: colors.cardBorder },
              ]}
            >
              <Text style={[styles.description, { color: colors.textSecondary, marginBottom: 0 }]}>
                {t("settings.password.description")}
              </Text>
              <PasswordInput
                placeholder={t("settings.password.current")}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                textContentType="password"
                testID="settings-current-password"
              />
              <PasswordInput
                placeholder={t("settings.password.next")}
                value={newPassword}
                onChangeText={setNewPassword}
                textContentType="newPassword"
                testID="settings-new-password"
              />
              <PasswordInput
                placeholder={t("settings.password.confirm")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                textContentType="newPassword"
                testID="settings-confirm-password"
              />
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  { backgroundColor: colors.accent },
                  isChangingPassword && styles.deleteButtonDisabled,
                ]}
                onPress={handleChangePassword}
                disabled={isChangingPassword}
                testID="settings-change-password-btn"
              >
                {isChangingPassword ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={[styles.saveButtonText, { color: colors.background }]}>
                    {t("settings.password.submit")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={[styles.description, { color: colors.textSecondary, marginTop: 20 }]}>
            {t("settings.account.deleteDescription")}
          </Text>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              { borderColor: "#ef4444" },
              isDeletingAccount && styles.deleteButtonDisabled,
            ]}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
            testID="delete-account-btn"
          >
            {isDeletingAccount ? (
              <ActivityIndicator color="#ef4444" />
            ) : (
              <Text style={[styles.deleteButtonText, { color: "#ef4444" }]}>
                {t("settings.account.deleteAccount")}
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      <View style={styles.legalLinks}>
        <TouchableOpacity
          onPress={() => router.push("/legal/terms" as Href)}
          testID="legal-terms-link"
        >
          <Text style={[styles.legalLinkText, { color: colors.primary }]}>
            {t("legal.termsLink")}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: colors.textSecondary }}>·</Text>
        <TouchableOpacity
          onPress={() => router.push("/legal/privacy" as Href)}
          testID="legal-privacy-link"
        >
          <Text style={[styles.legalLinkText, { color: colors.primary }]}>
            {t("legal.privacyLink")}
          </Text>
        </TouchableOpacity>
        <Text style={{ color: colors.textSecondary }}>·</Text>
        <TouchableOpacity
          onPress={() => router.push("/legal/acknowledgements" as Href)}
          testID="legal-ack-link"
        >
          <Text style={[styles.legalLinkText, { color: colors.primary }]}>
            {t("legal.acknowledgementsLink")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function AccountRow({
  icon,
  label,
  colors,
  onPress,
  testID,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ThemeColors;
  onPress: () => void;
  testID?: string;
  trailing?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        accountRowStyles.row,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
      onPress={onPress}
      testID={testID}
    >
      <Ionicons name={icon} size={20} color={colors.accent} />
      <Text style={[accountRowStyles.label, { color: colors.text }]}>{label}</Text>
      {trailing ? (
        <Text style={[accountRowStyles.trailing, { color: colors.textSecondary }]}>
          {trailing}
        </Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      )}
    </TouchableOpacity>
  );
}

const accountRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  trailing: {
    fontSize: 12,
    fontWeight: "600",
  },
});

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
      paddingHorizontal: 20,
      paddingBottom: 40,
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },
    backButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      marginTop: 28,
      marginBottom: 8,
    },
    description: {
      fontSize: 14,
      marginBottom: 16,
    },
    options: {
      gap: 12,
      marginBottom: 8,
    },
    option: {
      borderRadius: 12,
      padding: 18,
      borderWidth: 2,
    },
    optionText: {
      fontSize: 16,
      fontWeight: "600",
    },
    goalsCard: {
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      gap: 14,
      marginBottom: 20,
    },
    goalField: {
      gap: 6,
    },
    goalLabel: {
      fontSize: 13,
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.6,
    },
    goalInput: {
      padding: 14,
      borderRadius: 10,
      fontSize: 16,
      fontWeight: "600",
    },
    saveButton: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginTop: 4,
      minHeight: 52,
      justifyContent: "center",
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "700",
    },
    accountMenu: {
      gap: 10,
      marginBottom: 12,
    },
    signInAccountBtn: {
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 12,
      minHeight: 52,
      justifyContent: "center",
    },
    passwordCard: {
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      gap: 12,
      marginBottom: 8,
    },
    currentEmail: {
      fontSize: 13,
      fontWeight: "600",
    },
    emailInput: {
      padding: 14,
      borderRadius: 10,
      fontSize: 16,
      fontWeight: "500",
      borderWidth: 1,
    },
    deleteButton: {
      borderRadius: 12,
      padding: 18,
      borderWidth: 2,
      alignItems: "center",
      minHeight: 52,
      justifyContent: "center",
      marginBottom: 20,
    },
    deleteButtonDisabled: {
      opacity: 0.7,
    },
    deleteButtonText: {
      fontSize: 16,
      fontWeight: "700",
    },
    legalLinks: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 28,
      marginBottom: 32,
      paddingHorizontal: 8,
      paddingVertical: 12,
    },
    legalLinkText: {
      fontSize: 13,
      fontWeight: "600",
      textDecorationLine: "underline",
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
  });
}