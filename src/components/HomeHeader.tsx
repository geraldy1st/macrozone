import { useTheme } from "@/contexts/ThemeContext";
import { StyleSheet, Text } from "react-native";
import { useTranslation } from "react-i18next";

export default function HomeHeader() {
  const { colors } = useTheme();
  const { i18n } = useTranslation();
  const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
  const currentDate = new Date().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Text
      style={[styles.date, { color: colors.textSecondary }]}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.8}
    >
      {currentDate}
    </Text>
  );
}

const styles = StyleSheet.create({
  date: {
    fontSize: 12,
    marginTop: 2,
    textTransform: "capitalize",
  },
});