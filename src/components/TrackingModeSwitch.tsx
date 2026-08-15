import { useTheme } from "@/contexts/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { ThemeColors } from "@/styles/themes";
import { router, type Href } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TrackingMode = "tracking" | "inspiration";

type TrackingModeSwitchProps = {
  active: TrackingMode;
};

export default function TrackingModeSwitch({ active }: TrackingModeSwitchProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const go = (mode: TrackingMode) => {
    if (mode === active) {
      return;
    }
    if (mode === "tracking") {
      router.push("/(tabs)" as Href);
      return;
    }
    router.push("/(tabs)/community" as Href);
  };

  return (
    <View
      style={[styles.row, { backgroundColor: colors.surface }]}
      testID="tracking-mode-switch"
    >
      <TouchableOpacity
        style={[
          styles.chip,
          active === "tracking" && { backgroundColor: colors.accent },
        ]}
        onPress={() => go("tracking")}
        testID="mode-tracking"
      >
        <Text
          style={[
            styles.label,
            {
              color:
                active === "tracking" ? colors.background : colors.textSecondary,
            },
          ]}
        >
          {t("modes.tracking")}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.chip,
          active === "inspiration" && { backgroundColor: colors.accent },
        ]}
        onPress={() => go("inspiration")}
        testID="mode-inspiration"
      >
        <Text
          style={[
            styles.label,
            {
              color:
                active === "inspiration"
                  ? colors.background
                  : colors.textSecondary,
            },
          ]}
        >
          {t("modes.inspiration")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      padding: 4,
      borderRadius: 999,
      marginBottom: 14,
    },
    chip: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      borderRadius: 999,
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
    },
  });
}
