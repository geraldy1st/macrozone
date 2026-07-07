import { useAlert } from "@/contexts/AlertContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { toggleFavorite } from "@/storage/favorites";
import { deleteMeal } from "@/storage/meals";
import type { ThemeColors } from "@/styles/themes";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

type MealItemProps = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string;
  isFavorite?: boolean;
  enableFavorite?: boolean;
  onToggleFavorite?: () => void;
  onDelete: () => void;
};

export default function MealItem({
  id,
  name,
  calories,
  protein,
  carbs,
  fat,
  photoUri,
  isFavorite = false,
  enableFavorite = false,
  onToggleFavorite,
  onDelete,
}: MealItemProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const styles = useThemedStyles(createStyles);

  const handlePress = async () => {
    if (!enableFavorite) {
      return;
    }

    const favorited = await toggleFavorite(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(
      favorited ? t("mealItem.favoriteAdded") : t("mealItem.favoriteRemoved"),
      "info",
    );
    onToggleFavorite?.();
  };

  const handleLongPress = () => {
    showAlert({
      title: t("mealItem.deleteTitle"),
      message: t("mealItem.deleteMessage", { name }),
      buttons: [
        { text: t("mealItem.cancel"), style: "cancel" },
        {
          text: t("mealItem.delete"),
          style: "destructive",
          onPress: async () => {
            await deleteMeal(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            showToast(t("mealItem.deletedMessage"), "success");
            onDelete();
          },
        },
      ],
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
    >
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" />
      )}
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {isFavorite && (
            <Ionicons name="star" size={16} color={colors.accent} />
          )}
        </View>
        <Text style={styles.macros} numberOfLines={1}>
          {t("macros.mealMacros", { calories, protein, carbs, fat })}
        </Text>
      </View>
      <View style={styles.calorieBadge}>
        <Text style={styles.calorieValue}>{calories}</Text>
        <Text style={styles.calorieUnit}>cal</Text>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    thumbnail: {
      width: 52,
      height: 52,
      borderRadius: 10,
      marginRight: 12,
    },
    content: {
      flex: 1,
      minWidth: 0,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    name: {
      flex: 1,
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    macros: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 4,
    },
    calorieBadge: {
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      minWidth: 52,
      marginLeft: 8,
    },
    calorieValue: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.accent,
    },
    calorieUnit: {
      fontSize: 9,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
    },
  });
}