import { ANALYZE_API_URL } from "@/constants/api";
import { useAuth } from "@/contexts/AuthContext";
import { addMeal } from "@/storage/meals";
import { AnalyzeMealError, analyzeMealPhoto } from "@/utils/analyzeMeal";
import { prepareImageForUpload } from "@/utils/photos";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { macroColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
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

export default function AddMealScreen() {
  const { t, i18n } = useTranslation();
  const { user, session, isConfigured } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createScreenStyles(colors), [colors]);
  const canUseAiScan = isConfigured && Boolean(user && session?.access_token);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasAiResult, setHasAiResult] = useState(false);

  const resetForm = () => {
    setName("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setPhotoUri(null);
    setHasAiResult(false);
  };

  const runAnalysis = async (uri: string) => {
    if (!ANALYZE_API_URL) {
      Alert.alert(
        t("addMeal.apiNotConfiguredTitle"),
        t("addMeal.apiNotConfiguredMessage"),
      );
      return;
    }

    if (!session?.access_token) {
      Alert.alert(t("addMeal.authRequiredTitle"), t("addMeal.authRequiredMessage"));
      return;
    }

    setIsAnalyzing(true);

    try {
      const { base64, uri: preparedUri } = await prepareImageForUpload(uri);
      setPhotoUri(preparedUri);
      const language = i18n.language === "fr" ? "fr" : "en";
      const analysis = await analyzeMealPhoto(
        base64,
        language,
        session.access_token,
      );

      setName(analysis.name);
      setCalories(String(analysis.calories));
      setProtein(String(analysis.protein));
      setCarbs(String(analysis.carbs));
      setFat(String(analysis.fat));
      setHasAiResult(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      if (error instanceof AnalyzeMealError) {
        const errorMessages = {
          UNAUTHORIZED: ["unauthorizedTitle", "unauthorizedMessage"],
          IMAGE_TOO_LARGE: ["imageTooLargeTitle", "imageTooLargeMessage"],
          RATE_LIMITED: ["rateLimitedTitle", "rateLimitedMessage"],
          AI_QUOTA_EXCEEDED: ["aiQuotaTitle", "aiQuotaMessage"],
          API_NOT_CONFIGURED: ["apiNotConfiguredTitle", "apiNotConfiguredMessage"],
          AUTH_REQUIRED: ["authRequiredTitle", "authRequiredMessage"],
          ANALYSIS_FAILED: ["analysisErrorTitle", "analysisErrorMessage"],
        } as const;

        const [titleKey, messageKey] =
          errorMessages[error.code] ?? errorMessages.ANALYSIS_FAILED;

        Alert.alert(t(`addMeal.${titleKey}`), t(`addMeal.${messageKey}`));
        return;
      }

      Alert.alert(
        t("addMeal.analysisErrorTitle"),
        t("addMeal.analysisErrorMessage"),
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePhotoSelected = async (uri: string) => {
    setHasAiResult(false);
    await runAnalysis(uri);
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await handlePhotoSelected(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        t("addMeal.cameraPermissionTitle"),
        t("addMeal.cameraPermissionMessage"),
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await handlePhotoSelected(result.assets[0].uri);
    }
  };

  const handleScanMeal = () => {
    Alert.alert(t("addMeal.photoPickerTitle"), undefined, [
      { text: t("addMeal.takePhoto"), onPress: takePhoto },
      { text: t("addMeal.choosePhoto"), onPress: pickFromLibrary },
      { text: t("mealItem.cancel"), style: "cancel" },
    ]);
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
    setHasAiResult(false);
  };

  const handleAddMeal = async () => {
    if (!name.trim() || calories.trim() === "") {
      Alert.alert(t("addMeal.errorTitle"), t("addMeal.errorMessage"));
      return;
    }

    setIsSaving(true);

    try {
      await addMeal(
        {
          name: name.trim(),
          calories: Number(calories),
          protein: Number(protein) || 0,
          carbs: Number(carbs) || 0,
          fat: Number(fat) || 0,
        },
        photoUri ?? undefined,
      );

      resetForm();
      showToast(t("addMeal.successMessage"), "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/");
    } catch {
      Alert.alert(t("addMeal.saveErrorTitle"), t("addMeal.saveErrorMessage"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, styles.screen]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>{t("addMeal.title")}</Text>

      {canUseAiScan ? (
        <TouchableOpacity
          style={styles.scanButton}
          onPress={handleScanMeal}
          testID="scan-meal-btn"
        >
          <Ionicons name="camera" size={22} color={colors.text} />
          <Text style={styles.scanButtonText}>{t("addMeal.scanMeal")}</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.authBanner}>
          <Ionicons name="lock-closed-outline" size={20} color={colors.accent} />
          <View style={styles.authBannerText}>
            <Text style={styles.authBannerTitle}>{t("addMeal.authRequiredTitle")}</Text>
            <Text style={styles.authBannerMessage}>
              {t("addMeal.authRequiredMessage")}
            </Text>
          </View>
          {isConfigured && (
            <TouchableOpacity
              style={styles.authBannerButton}
              onPress={() => router.push("/login")}
              testID="auth-prompt-btn"
            >
              <Text style={styles.authBannerButtonText}>{t("auth.signIn")}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {photoUri && (
        <View style={styles.photoCard}>
          <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />

          <View style={styles.photoActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => photoUri && runAnalysis(photoUri)}
              disabled={isAnalyzing}
            >
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.secondaryButtonText}>{t("addMeal.analyzePhoto")}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.removeButton} onPress={handleRemovePhoto}>
              <Text style={styles.removeButtonText}>{t("addMeal.removePhoto")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isAnalyzing && (
        <View style={styles.analyzingRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.analyzingText}>{t("addMeal.analyzing")}</Text>
        </View>
      )}

      {hasAiResult && !isAnalyzing && (
        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={16} color={colors.accent} />
          <Text style={styles.disclaimerText}>{t("addMeal.aiDisclaimer")}</Text>
        </View>
      )}

      <TextInput
        style={styles.input}
        placeholder={t("addMeal.mealName")}
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
        testID="meal-name-input"
      />

      <TextInput
        style={styles.input}
        placeholder={t("addMeal.calories")}
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        value={calories}
        onChangeText={setCalories}
        testID="meal-calories-input"
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder={t("addMeal.protein")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={protein}
          onChangeText={setProtein}
        />
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder={t("addMeal.carbs")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={carbs}
          onChangeText={setCarbs}
        />
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder={t("addMeal.fat")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={fat}
          onChangeText={setFat}
        />
      </View>

      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={[styles.button, (isSaving || isAnalyzing) && styles.buttonDisabled]}
          onPress={handleAddMeal}
          disabled={isSaving || isAnalyzing}
          testID="add-meal-submit"
        >
          {isSaving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.buttonText}>{t("addMeal.submit")}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createScreenStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  screen: {
    paddingBottom: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
  },
  authBanner: {
    marginTop: 20,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 12,
  },
  authBannerText: {
    gap: 4,
  },
  authBannerTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  authBannerMessage: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  authBannerButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  authBannerButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "700",
  },
  scanButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: macroColors.accent,
    padding: 18,
    borderRadius: 14,
    marginTop: 20,
  },
  scanButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  photoCard: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  photo: {
    width: "100%",
    height: 220,
  },
  photoActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: "600",
  },
  removeButton: {
    paddingVertical: 4,
  },
  removeButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  analyzingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: `${colors.accent}18`,
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: `${colors.accent}44`,
  },
  disclaimerText: {
    flex: 1,
    color: colors.accent,
    fontSize: 13,
    fontWeight: "500",
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 16,
    borderRadius: 10,
    fontSize: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowInput: {
    flex: 1,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: "bold",
  },
  });
}