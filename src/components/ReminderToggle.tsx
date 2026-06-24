import { colors } from "@/styles/global";
import {
  cancelMealReminders,
  requestPermissions,
  scheduleMealReminders,
} from "@/utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useTranslation } from "react-i18next";

const REMINDERS_KEY = "remindersEnabled";

export default function ReminderToggle() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const load = async () => {
      const val = await AsyncStorage.getItem(REMINDERS_KEY);
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
    await AsyncStorage.setItem(REMINDERS_KEY, value.toString());
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

const styles = StyleSheet.create({
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