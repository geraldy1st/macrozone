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
import { colors, globalStyles } from "@/styles/global";
import {
  cancelMealReminders,
  scheduleMealReminders,
} from "@/utils/notifications";
import { useAuth } from "@/contexts/AuthContext";
import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
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
};

const goalFields: { key: keyof MacroGoals; labelKey: string }[] = [
  { key: "calories", labelKey: "settings.goals.calories" },
  { key: "protein", labelKey: "settings.goals.protein" },
  { key: "carbs", labelKey: "settings.goals.carbs" },
  { key: "fat", labelKey: "settings.goals.fat" },
];

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { user, isConfigured, signOut } = useAuth();
  const currentLanguage = i18n.language as AppLanguage;
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

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(tabs)");
    } catch {
      Alert.alert(t("auth.errorTitle"), t("auth.signOutErrorMessage"));
    }
  };

  const handleSaveGoals = async () => {
    const parsedGoals: MacroGoals = {
      calories: Number(goals.calories) || defaultMacroGoals.calories,
      protein: Number(goals.protein) || defaultMacroGoals.protein,
      carbs: Number(goals.carbs) || defaultMacroGoals.carbs,
      fat: Number(goals.fat) || defaultMacroGoals.fat,
    };

    await setMacroGoals(parsedGoals);
    Alert.alert(t("settings.goals.savedTitle"), t("settings.goals.savedMessage"));
  };

  return (
    <ScrollView style={globalStyles.container} showsVerticalScrollIndicator={false}>
      <Text style={globalStyles.title}>{t("settings.title")}</Text>

      <Text style={globalStyles.sectionTitle}>{t("settings.account.title")}</Text>
      <View style={styles.accountCard}>
        {user ? (
          <>
            <Text style={styles.accountEmail}>{user.email}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutText}>{t("settings.account.signOut")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.description}>{t("settings.account.guestDescription")}</Text>
            {isConfigured && (
              <TouchableOpacity
                style={styles.signInButton}
                onPress={() => router.push("/login")}
              >
                <Text style={styles.signInText}>{t("auth.signIn")}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      <Text style={globalStyles.sectionTitle}>{t("settings.language")}</Text>
      <Text style={styles.description}>{t("settings.languageDescription")}</Text>

      <View style={styles.options}>
        {supportedLanguages.map((language) => {
          const isSelected = currentLanguage === language;

          return (
            <TouchableOpacity
              key={language}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => handleLanguageChange(language)}
              testID={`language-${language}`}
            >
              <Text
                style={[styles.optionText, isSelected && styles.optionTextSelected]}
              >
                {t(languageLabels[language])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={globalStyles.sectionTitle}>{t("settings.goals.title")}</Text>
      <Text style={styles.description}>{t("settings.goals.description")}</Text>

      <View style={styles.goalsCard}>
        {goalFields.map(({ key, labelKey }) => (
          <View key={key} style={styles.goalField}>
            <Text style={styles.goalLabel}>{t(labelKey)}</Text>
            <TextInput
              style={styles.goalInput}
              value={goals[key]}
              onChangeText={(value) =>
                setGoals((current) => ({ ...current, [key]: value }))
              }
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveGoals}>
          <Text style={styles.saveButtonText}>{t("settings.goals.save")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  accountCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
    marginBottom: 8,
  },
  accountEmail: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  signOutButton: {
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  signOutText: {
    color: colors.alert,
    fontSize: 15,
    fontWeight: "600",
  },
  signInButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  signInText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  options: {
    gap: 12,
    marginBottom: 8,
  },
  option: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.cardBorder,
  },
  optionSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  optionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: colors.accent,
    fontWeight: "700",
  },
  goalsCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 14,
    marginBottom: 40,
  },
  goalField: {
    gap: 6,
  },
  goalLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  goalInput: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});