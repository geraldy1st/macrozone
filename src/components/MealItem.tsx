import { useToast } from "@/contexts/ToastContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { deleteMeal } from "@/storage/meals";
import type { ThemeColors } from "@/styles/themes";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";

type MealItemProps = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  photoUri?: string;
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
  onDelete,
}: MealItemProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);

  const handleLongPress = () => {
    Alert.alert(
      t("mealItem.deleteTitle"),
      t("mealItem.deleteMessage", { name }),
      [
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
    );
  };

  return (
    <TouchableOpacity style={styles.container} onLongPress={handleLongPress}>
      {photoUri && (
        <Image source={{ uri: photoUri }} style={styles.thumbnail} contentFit="cover" />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.macros}>
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
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  macros: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  calorieBadge: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 56,
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.accent,
  },
  calorieUnit: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
  },
  });
}