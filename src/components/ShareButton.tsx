import ShareSummaryCard from "@/components/ShareSummaryCard";
import {
  defaultMacroGoals,
  getMacroGoals,
  type MacroGoals,
} from "@/storage/goals";
import { Meal } from "@/storage/meals";
import { colors } from "@/styles/global";
import { formatDateKey, formatMealDayLabel } from "@/utils/groupMealsByDay";
import { captureAndShareSummary } from "@/utils/shareSummaryImage";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type ShareButtonProps = {
  meals: Meal[];
};

export default function ShareButton({ meals }: ShareButtonProps) {
  const { t, i18n } = useTranslation();
  const cardRef = useRef<View>(null);
  const [goals, setGoals] = useState<MacroGoals>(defaultMacroGoals);
  const [isSharing, setIsSharing] = useState(false);

  const dateLabel = formatMealDayLabel(formatDateKey(new Date()), i18n.language, {
    today: t("allMeals.today"),
    yesterday: t("allMeals.yesterday"),
  });

  useEffect(() => {
    getMacroGoals().then(setGoals);
  }, []);

  const waitForLayout = () =>
    new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });

  const handleShare = async () => {
    if (meals.length === 0) {
      Alert.alert(t("share.noMealsTitle"), t("share.noMealsMessage"));
      return;
    }

    setIsSharing(true);

    try {
      await waitForLayout();
      await captureAndShareSummary(cardRef, t("share.dialogTitle"));
    } catch {
      Alert.alert(t("share.errorTitle"), t("share.errorMessage"));
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleShare}
        disabled={isSharing}
        accessibilityLabel={t("share.buttonLabel")}
      >
        {isSharing ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Ionicons name="share-outline" size={24} color={colors.accent} />
        )}
      </TouchableOpacity>

      <View style={styles.offscreen} pointerEvents="none">
        <ShareSummaryCard
          ref={cardRef}
          meals={meals}
          goals={goals}
          dateLabel={dateLabel}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    top: 0,
    left: -5000,
    opacity: 0,
  },
});