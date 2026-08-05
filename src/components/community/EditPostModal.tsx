import { useTheme } from "@/contexts/ThemeContext";
import { MAX_CAPTION_LENGTH, type FeedPost } from "@/types/community";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
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

type EditPostModalProps = {
  visible: boolean;
  post: FeedPost | null;
  isSaving?: boolean;
  onClose: () => void;
  onSave: (input: { mealName: string; caption: string }) => void;
};

export default function EditPostModal({
  visible,
  post,
  isSaving,
  onClose,
  onSave,
}: EditPostModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mealName, setMealName] = useState("");
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (visible && post) {
      setMealName(post.meal_name);
      setCaption(post.caption ?? "");
    }
  }, [visible, post]);

  const canSave = mealName.trim().length > 0 && !isSaving;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.wrap}
        >
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>
                {t("community.editTitle")}
              </Text>
              <TouchableOpacity onPress={onClose} hitSlop={10} testID="edit-post-close">
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t("addMeal.mealName")}
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
              value={mealName}
              onChangeText={setMealName}
              placeholder={t("addMeal.mealName")}
              placeholderTextColor={colors.textSecondary}
              testID="edit-post-meal-name"
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {t("community.captionLabel")}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.multiline,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.cardBorder,
                },
              ]}
              value={caption}
              onChangeText={(text) => setCaption(text.slice(0, MAX_CAPTION_LENGTH))}
              placeholder={t("community.captionPlaceholder")}
              placeholderTextColor={colors.textSecondary}
              multiline
              testID="edit-post-caption"
            />
            <Text style={[styles.counter, { color: colors.textSecondary }]}>
              {caption.length}/{MAX_CAPTION_LENGTH}
            </Text>

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: colors.accent },
                !canSave && styles.saveDisabled,
              ]}
              disabled={!canSave}
              onPress={() =>
                onSave({ mealName: mealName.trim(), caption: caption.trim() })
              }
              testID="edit-post-save"
            >
              {isSaving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={[styles.saveText, { color: colors.background }]}>
                  {t("community.editSave")}
                </Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function createStyles(colors: {
  text: string;
  textSecondary: string;
  card: string;
  cardBorder: string;
  surface: string;
  accent: string;
  background: string;
}) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    wrap: {
      width: "100%",
    },
    sheet: {
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      padding: 20,
      gap: 8,
      paddingBottom: 28,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      marginTop: 6,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      fontWeight: "500",
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: "top",
    },
    counter: {
      fontSize: 12,
      fontWeight: "500",
      alignSelf: "flex-end",
    },
    saveBtn: {
      marginTop: 12,
      borderRadius: 12,
      padding: 16,
      alignItems: "center",
      minHeight: 52,
      justifyContent: "center",
    },
    saveDisabled: {
      opacity: 0.6,
    },
    saveText: {
      fontSize: 16,
      fontWeight: "700",
    },
  });
}
