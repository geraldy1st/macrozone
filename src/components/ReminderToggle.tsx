import { useTheme } from "@/contexts/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { ThemeColors } from "@/styles/themes";
import {
  cancelMealReminders,
  requestPermissions,
  scheduleMealReminders,
} from "@/utils/notifications";
import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

function getRemindersKey() {
  return scopedKey("remindersEnabled");
}

export default function ReminderToggle() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const val = await AsyncStorage.getItem(getRemindersKey());
      setEnabled(val === "true");
    };
    load();
  }, []);

  const toggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) return;
      await scheduleMealReminders();
    } else {
      await cancelMealReminders();
    }
    setEnabled(value);
    await AsyncStorage.setItem(getRemindersKey(), value.toString());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t("reminders.label")}</Text>
      <Switch
        value={enabled}
        onValueChange={toggle}
        trackColor={{ false: colors.surface, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    label: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
    },
  });
}