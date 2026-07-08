import FavoriteStar from "@/components/FavoriteStar";
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
  showFavoriteStar?: boolean;
  onToggleFavorite?: () => void;
  onPress?: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
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
  showFavoriteStar = false,
  onToggleFavorite,
  onPress,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
  onDelete,
}: MealItemProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { showAlert } = useAlert();
  const styles = useThemedStyles(createStyles);

  const handleFavoritePress = async () => {
    const favorited = await toggleFavorite(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showToast(
      favorited ? t("mealItem.favoriteAdded") : t("mealItem.favoriteRemoved"),
      "info",
    );
    onToggleFavorite?.();
  };

  const handleLongPress = () => {
    if (selectionMode) {
      return;
    }

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

  const handlePress = () => {
    if (selectionMode) {
      onToggleSelect?.();
      return;
    }

    onPress?.();
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        selectionMode && isSelected && styles.containerSelected,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={400}
    >
      {selectionMode && (
        <TouchableOpacity
          style={[
            styles.checkbox,
            {
              borderColor: isSelected ? colors.accent : colors.cardBorder,
              backgroundColor: isSelected ? colors.accent : colors.surface,
            },
          ]}
          onPress={onToggleSelect}
        >
          {isSelected && <Ionicons name="checkmark" size={14} color={colors.background} />}
        </TouchableOpacity>
      )}

      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.macros} numberOfLines={1}>
          {t("macros.mealMacros", { calories, protein, carbs, fat })}
        </Text>
      </View>

      {showFavoriteStar && (
        <FavoriteStar
          isFavorite={isFavorite}
          onPress={handleFavoritePress}
          testID={`favorite-star-${id}`}
        />
      )}

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
    containerSelected: {
      borderColor: colors.accent,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
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
    name: {
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
      marginLeft: 4,
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