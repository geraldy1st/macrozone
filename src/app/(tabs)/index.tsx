import AppLogo from "@/components/AppLogo";
import CopyButton from "@/components/CopyButton";
import HomeHeader from "@/components/HomeHeader";
import MacroGrid from "@/components/MacroGrid";
import RecentMeals from "@/components/RecentMeals";
import ReminderToggle from "@/components/ReminderToggle";
import ShareButton from "@/components/ShareButton";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { useAuth } from "@/contexts/AuthContext";
import { getMeals, Meal } from "@/storage/meals";
import { useTheme } from "@/contexts/ThemeContext";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { globalStyles } from "@/styles/global";
import type { ThemeColors } from "@/styles/themes";
import { filterMealsForToday } from "@/utils/groupMealsByDay";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [quote, setQuote] = useState(() => getRandomQuote());

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  useFocusEffect(
    useCallback(() => {
      loadMeals();
      setQuote((currentQuote) => getRandomQuote(currentQuote));
    }, [i18n.language, user?.id]),
  );

  const todayMeals = useMemo(() => filterMealsForToday(meals), [meals]);

  return (
    <ScrollView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <View style={globalStyles.header}>
          <View style={styles.titleRow}>
            <AppLogo size={44} />
            <View>
              <Text style={[globalStyles.title, { color: colors.text }]}>
                {t("app.name")}
              </Text>
              <HomeHeader />
            </View>
          </View>
          <ShareButton meals={todayMeals} />
        </View>

        <View style={styles.quoteCard}>
          <View style={styles.quoteAccent} />
          <Text style={styles.quote}>{quote}</Text>
        </View>
      </View>

      <MacroGrid meals={todayMeals} />

      <View style={styles.actionsCard}>
        <CopyButton meals={todayMeals} />
        <View style={styles.divider} />
        <ReminderToggle />
      </View>

      <RecentMeals meals={todayMeals} onDelete={loadMeals} />
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    content: {
      paddingBottom: 40,
    },
    heroSection: {
      marginBottom: 28,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
    },
    quoteCard: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginTop: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    quoteAccent: {
      width: 4,
      backgroundColor: colors.accent,
    },
    quote: {
      flex: 1,
      fontSize: 15,
      fontStyle: "italic",
      fontWeight: "500",
      color: colors.primary,
      padding: 16,
      lineHeight: 22,
    },
    actionsCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 18,
      marginTop: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      gap: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.cardBorder,
      marginVertical: 8,
    },
  });
}