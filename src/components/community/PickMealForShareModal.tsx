import { useTheme } from "@/contexts/ThemeContext";
import { getMeals, type Meal } from "@/storage/meals";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PickMealForShareModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (meal: Meal) => void;
};

export default function PickMealForShareModal({
  visible,
  onClose,
  onSelect,
}: PickMealForShareModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void getMeals()
      .then((rows) => {
        if (!cancelled) {
          setMeals(rows);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("community.pickMealTitle")}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10} testID="pick-meal-close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t("community.pickMealHint")}
          </Text>

          {isLoading ? (
            <ActivityIndicator style={{ marginVertical: 32 }} color={colors.accent} />
          ) : (
            <FlatList
              data={meals}
              keyExtractor={(item) => item.id}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                  {t("community.pickMealEmpty")}
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.row,
                    { borderColor: colors.cardBorder, backgroundColor: colors.surface },
                  ]}
                  onPress={() => onSelect(item)}
                  testID={`pick-meal-${item.id}`}
                >
                  {item.photoUri ? (
                    <Image
                      source={{ uri: item.photoUri }}
                      style={styles.thumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[styles.thumbPlaceholder, { backgroundColor: colors.card }]}
                    >
                      <Ionicons
                        name="restaurant-outline"
                        size={18}
                        color={colors.textSecondary}
                      />
                    </View>
                  )}
                  <View style={styles.rowBody}>
                    <Text style={[styles.rowName, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                      {t("macros.mealMacros", {
                        calories: item.calories,
                        protein: item.protein,
                        carbs: item.carbs,
                        fat: item.fat,
                      })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            />
          )}
        </Pressable>
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
}) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    sheet: {
      maxHeight: "78%",
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderWidth: 1,
      paddingHorizontal: 16,
      paddingTop: 16,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 18,
      fontWeight: "800",
    },
    hint: {
      fontSize: 13,
      fontWeight: "500",
      marginTop: 6,
      marginBottom: 12,
      lineHeight: 18,
    },
    list: {
      flexGrow: 0,
    },
    empty: {
      textAlign: "center",
      paddingVertical: 32,
      fontSize: 14,
      fontWeight: "500",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderRadius: 12,
      padding: 10,
      marginBottom: 10,
    },
    thumb: {
      width: 48,
      height: 48,
      borderRadius: 10,
    },
    thumbPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    rowBody: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    rowName: {
      fontSize: 15,
      fontWeight: "700",
    },
    rowMeta: {
      fontSize: 12,
      fontWeight: "500",
    },
  });
}
