import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { getMealById, updateMeal } from "@/storage/meals";
import { saveMealPhoto } from "@/utils/photos";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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

export default function EditMealScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const bottomPadding = useBottomContentPadding(20, false);
  const styles = useMemo(() => createScreenStyles(colors), [colors]);

  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [description, setDescription] = useState("");
  const [recipe, setRecipe] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadMeal = useCallback(async () => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    const meal = await getMealById(id);
    setIsLoading(false);

    if (!meal) {
      showAlert({
        title: t("mealEdit.notFoundTitle"),
        message: t("mealEdit.notFoundMessage"),
        buttons: [{ text: t("common.ok"), onPress: () => router.back() }],
      });
      return;
    }

    setName(meal.name);
    setCalories(String(meal.calories));
    setProtein(String(meal.protein));
    setCarbs(String(meal.carbs));
    setFat(String(meal.fat));
    setDescription(meal.description ?? "");
    setRecipe(meal.recipe ?? "");
    setPhotoUri(meal.photoUri ?? null);
  }, [id, showAlert, t]);

  useFocusEffect(
    useCallback(() => {
      loadMeal();
    }, [loadMeal]),
  );

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUri(null);
  };

  const handleSave = async () => {
    if (!id || !name.trim() || calories.trim() === "") {
      showAlert({
        title: t("addMeal.errorTitle"),
        message: t("addMeal.errorMessage"),
      });
      return;
    }

    setIsSaving(true);

    try {
      let savedPhotoUri: string | undefined | null = photoUri;

      if (photoUri && !photoUri.includes("meal-photos")) {
        savedPhotoUri = await saveMealPhoto(photoUri, id);
      } else if (!photoUri) {
        savedPhotoUri = null;
      }

      await updateMeal(id, {
        name: name.trim(),
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        description: description.trim() || undefined,
        recipe: recipe.trim() || undefined,
        photoUri: savedPhotoUri,
      });

      showToast(t("mealEdit.savedMessage"), "success");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      showAlert({
        title: t("addMeal.saveErrorTitle"),
        message: t("addMeal.saveErrorMessage"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{t("mealEdit.title")}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {photoUri ? (
          <View style={[styles.photoCard, { borderColor: colors.cardBorder }]}>
            <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            <View style={styles.photoActions}>
              <TouchableOpacity onPress={handlePickPhoto}>
                <Text style={[styles.linkText, { color: colors.accent }]}>
                  {t("mealEdit.changePhoto")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRemovePhoto}>
                <Text style={[styles.mutedText, { color: colors.textSecondary }]}>
                  {t("addMeal.removePhoto")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addPhotoButton, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
            onPress={handlePickPhoto}
          >
            <Ionicons name="image-outline" size={22} color={colors.accent} />
            <Text style={[styles.addPhotoText, { color: colors.text }]}>
              {t("mealEdit.addPhoto")}
            </Text>
          </TouchableOpacity>
        )}

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
          placeholder={t("addMeal.mealName")}
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
          placeholder={t("addMeal.calories")}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          value={calories}
          onChangeText={setCalories}
        />

        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.rowInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
            placeholder={t("addMeal.protein")}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={protein}
            onChangeText={setProtein}
          />
          <TextInput
            style={[styles.input, styles.rowInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
            placeholder={t("addMeal.carbs")}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={carbs}
            onChangeText={setCarbs}
          />
          <TextInput
            style={[styles.input, styles.rowInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
            placeholder={t("addMeal.fat")}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            value={fat}
            onChangeText={setFat}
          />
        </View>

        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
          placeholder={t("addMeal.description")}
          placeholderTextColor={colors.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.cardBorder }]}
          placeholder={t("addMeal.recipe")}
          placeholderTextColor={colors.textSecondary}
          value={recipe}
          onChangeText={setRecipe}
          multiline
        />

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.saveButtonText, { color: colors.background }]}>
              {t("mealEdit.save")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createScreenStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 60,
    },
    loading: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 16,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.5,
    },
    content: {
      paddingHorizontal: 20,
      gap: 0,
    },
    photoCard: {
      borderRadius: 16,
      overflow: "hidden",
      borderWidth: 1,
      marginBottom: 16,
    },
    photo: {
      width: "100%",
      height: 200,
    },
    photoActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 14,
    },
    addPhotoButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderWidth: 1,
      borderRadius: 14,
      padding: 18,
      marginBottom: 16,
    },
    addPhotoText: {
      fontSize: 15,
      fontWeight: "600",
    },
    linkText: {
      fontSize: 14,
      fontWeight: "600",
    },
    mutedText: {
      fontSize: 13,
    },
    input: {
      padding: 16,
      borderRadius: 10,
      fontSize: 16,
      marginTop: 16,
      borderWidth: 1,
    },
    multiline: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    row: {
      flexDirection: "row",
      gap: 10,
    },
    rowInput: {
      flex: 1,
    },
    saveButton: {
      marginTop: 24,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      minHeight: 52,
      justifyContent: "center",
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: "bold",
    },
  });
}