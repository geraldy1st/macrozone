import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { createPost, upsertMyProfile } from "@/services/community";
import { getUserProfile } from "@/storage/profile";
import { MAX_CAPTION_LENGTH } from "@/types/community";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export type ShareMealPayload = {
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description?: string;
  recipe?: string;
  localImageUri?: string | null;
};

type ShareToCommunityModalProps = {
  visible: boolean;
  meal: ShareMealPayload | null;
  onClose: () => void;
  onShared?: () => void;
};

export default function ShareToCommunityModal({
  visible,
  meal,
  onClose,
  onShared,
}: ShareToCommunityModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [caption, setCaption] = useState("");
  const [isSharing, setIsSharing] = useState(false);

  const handleClose = () => {
    if (isSharing) {
      return;
    }
    setCaption("");
    onClose();
  };

  const handleShare = async () => {
    if (!user || !meal) {
      return;
    }

    setIsSharing(true);

    try {
      const localProfile = await getUserProfile();
      await upsertMyProfile({
        userId: user.id,
        displayName:
          localProfile.name.trim() ||
          user.email?.split("@")[0] ||
          "User",
        avatarUrl: null,
      });

      await createPost(user.id, {
        mealName: meal.mealName,
        caption,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        description: meal.description,
        recipeExcerpt: meal.recipe,
        localImageUri: meal.localImageUri ?? undefined,
      });

      showToast(t("community.shareSuccess"), "success");
      setCaption("");
      onShared?.();
      onClose();
    } catch {
      showToast(t("community.shareError"), "error");
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetWrap}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("community.shareTitle")}
              </Text>
              <TouchableOpacity onPress={handleClose} hitSlop={10}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {meal ? (
              <>
                <Text style={[styles.mealName, { color: colors.text }]}>
                  {meal.mealName}
                </Text>
                <Text style={[styles.macros, { color: colors.textSecondary }]}>
                  {meal.calories} kcal · P {meal.protein}g · C {meal.carbs}g · F{" "}
                  {meal.fat}g
                </Text>

                {meal.localImageUri ? (
                  <Image
                    source={{ uri: meal.localImageUri }}
                    style={styles.preview}
                    contentFit="cover"
                  />
                ) : null}

                <Text style={[styles.label, { color: colors.textSecondary }]}>
                  {t("community.captionLabel")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  value={caption}
                  onChangeText={(value) =>
                    setCaption(value.slice(0, MAX_CAPTION_LENGTH))
                  }
                  placeholder={t("community.captionPlaceholder")}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  maxLength={MAX_CAPTION_LENGTH}
                  testID="community-caption-input"
                />
                <Text style={[styles.counter, { color: colors.textSecondary }]}>
                  {caption.length}/{MAX_CAPTION_LENGTH}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.shareButton,
                    { backgroundColor: colors.accent },
                    isSharing && styles.disabled,
                  ]}
                  onPress={handleShare}
                  disabled={isSharing}
                  testID="community-share-submit"
                >
                  {isSharing ? (
                    <ActivityIndicator color={colors.background} />
                  ) : (
                    <Text style={[styles.shareButtonText, { color: colors.background }]}>
                      {t("community.shareSubmit")}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : null}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheetWrap: {
      width: "100%",
    },
    sheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      gap: 10,
      maxHeight: "90%",
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
    },
    mealName: {
      fontSize: 16,
      fontWeight: "700",
    },
    macros: {
      fontSize: 13,
      fontWeight: "500",
    },
    preview: {
      width: "100%",
      height: 160,
      borderRadius: 12,
      marginTop: 4,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 6,
    },
    input: {
      minHeight: 90,
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      textAlignVertical: "top",
    },
    counter: {
      alignSelf: "flex-end",
      fontSize: 12,
      fontWeight: "600",
    },
    shareButton: {
      marginTop: 8,
      padding: 16,
      borderRadius: 12,
      alignItems: "center",
      minHeight: 52,
      justifyContent: "center",
      marginBottom: 8,
    },
    shareButtonText: {
      fontSize: 16,
      fontWeight: "700",
    },
    disabled: {
      opacity: 0.7,
    },
  });
}
