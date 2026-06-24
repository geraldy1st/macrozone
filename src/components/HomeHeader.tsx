import { colors } from "@/styles/global";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function HomeHeader() {
  const { i18n } = useTranslation();
  const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
  const currentDate = new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return <Text style={styles.date}>{currentDate}</Text>;
}

const styles = StyleSheet.create({
  date: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: "capitalize",
  },
});