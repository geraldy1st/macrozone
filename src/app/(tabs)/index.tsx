import AnimatedPressable from "@/components/AnimatedPressable";
import AppLogo from "@/components/AppLogo";
import CopyButton from "@/components/CopyButton";
import HomeHeader from "@/components/HomeHeader";
import MacroGrid from "@/components/MacroGrid";
import RecentMeals from "@/components/RecentMeals";
import ReminderToggle from "@/components/ReminderToggle";
import ShareButton from "@/components/ShareButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { getMeals, Meal } from "@/storage/meals";
import { getUserProfile } from "@/storage/profile";
import { globalStyles } from "@/styles/global";
import type { ThemeColors } from "@/styles/themes";
import { filterMealsForToday } from "@/utils/groupMealsByDay";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [userName, setUserName] = useState("");
  const [quote, setQuote] = useState("");

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  useFocusEffect(
    useCallback(() => {
      void loadMeals();
      void getUserProfile().then((profile) => {
        const name = profile.name.trim();
        setUserName(name);
        setQuote((current) => getRandomQuote(current, name));
      });
    }, [i18n.language, user?.id]),
  );

  const todayMeals = useMemo(() => filterMealsForToday(meals), [meals]);

  const handleCopyQuote = async () => {
    if (!quote.trim()) {
      return;
    }

    await Clipboard.setStringAsync(quote);
    showToast(t("home.quoteCopied"), "success");
  };

  const handleRefreshQuote = () => {
    setQuote((current) => getRandomQuote(current, userName));
  };

  return (
    <ScrollView
      style={[globalStyles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroSection}>
        <View style={globalStyles.header}>
          <View style={styles.titleRow}>
            <AppLogo size={44} />
            <View style={styles.titleBlock}>
              <Text
                style={[globalStyles.title, styles.appTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {t("app.name")}
              </Text>
              <HomeHeader />
            </View>
          </View>
          <ShareButton meals={todayMeals} />
        </View>

        <View style={styles.quoteCard}>
          <View style={styles.quoteAccent} />
          <TouchableOpacity
            style={styles.quotePressable}
            onLongPress={handleCopyQuote}
            delayLongPress={350}
            activeOpacity={0.85}
            testID="home-quote-text"
          >
            <Text style={styles.quote} numberOfLines={4}>
              {quote}
            </Text>
          </TouchableOpacity>
          <AnimatedPressable
            style={styles.quoteRefreshButton}
            onPress={handleRefreshQuote}
            accessibilityLabel={t("home.newQuote")}
            testID="home-quote-refresh-btn"
          >
            <Ionicons name="refresh" size={18} color={colors.accent} />
          </AnimatedPressable>
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
    content: {},
    heroSection: {
      marginBottom: 28,
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      flex: 1,
      minWidth: 0,
    },
    titleBlock: {
      flex: 1,
      minWidth: 0,
    },
    appTitle: {
      fontSize: 24,
    },
    quoteCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 14,
      marginTop: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    quoteAccent: {
      width: 4,
      alignSelf: "stretch",
      backgroundColor: colors.accent,
    },
    quotePressable: {
      flex: 1,
      minWidth: 0,
    },
    quote: {
      fontSize: 13,
      fontStyle: "italic",
      fontWeight: "500",
      color: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 12,
      lineHeight: 19,
    },
    quoteRefreshButton: {
      paddingHorizontal: 14,
      paddingVertical: 14,
      justifyContent: "center",
      alignItems: "center",
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
