import AnimatedPressable from "@/components/AnimatedPressable";
import AppLogo from "@/components/AppLogo";
import CopyButton from "@/components/CopyButton";
import HomeHeader from "@/components/HomeHeader";
import MacroGrid from "@/components/MacroGrid";
import MotivationOverlay from "@/components/MotivationOverlay";
import RecentMeals from "@/components/RecentMeals";
import ReminderToggle from "@/components/ReminderToggle";
import ShareButton from "@/components/ShareButton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  pickCelebrationPalette,
  type CelebrationPalette,
} from "@/data/celebrationPalettes";
import { getRandomQuote } from "@/data/motivationalQuotes";
import { useBottomContentPadding } from "@/hooks/useBottomContentPadding";
import { useThemedStyles } from "@/hooks/useThemedStyles";
import { consumePendingCelebration } from "@/storage/celebration";
import { getMeals, Meal } from "@/storage/meals";
import { getUserProfile } from "@/storage/profile";
import { globalStyles } from "@/styles/global";
import { macroColors, type ThemeColors } from "@/styles/themes";
import { filterMealsForToday } from "@/utils/groupMealsByDay";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const bottomPadding = useBottomContentPadding();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const [celebrationQuote, setCelebrationQuote] = useState("");
  const [celebrationPalette, setCelebrationPalette] =
    useState<CelebrationPalette | null>(null);

  const loadMeals = async () => {
    const data = await getMeals();
    setMeals(data);
  };

  useFocusEffect(
    useCallback(() => {
      void loadMeals();

      let cancelled = false;

      void (async () => {
        const pending = await consumePendingCelebration();
        if (cancelled || !pending) {
          return;
        }

        const profile = await getUserProfile();
        const name = profile.name.trim() || undefined;
        const quote = getRandomQuote(undefined, name);
        if (!quote || cancelled) {
          return;
        }

        setCelebrationQuote(quote);
        setCelebrationPalette(pickCelebrationPalette(isDark));
        setCelebrationVisible(true);
      })();

      return () => {
        cancelled = true;
      };
    }, [i18n.language, user?.id, isDark]),
  );

  const todayMeals = useMemo(() => filterMealsForToday(meals), [meals]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
        </View>

        <MacroGrid meals={todayMeals} />

        <AnimatedPressable
          style={[styles.addMealButton, { backgroundColor: macroColors.accent }]}
          onPress={() => router.push("/(tabs)/add-meals")}
          testID="home-add-meal-btn"
        >
          <View style={styles.addMealButtonContent}>
            <Ionicons name="add-circle" size={22} color={colors.text} />
            <Text style={[styles.addMealButtonText, { color: colors.text }]}>
              {t("home.addMeal")}
            </Text>
          </View>
        </AnimatedPressable>

        <View style={styles.actionsCard}>
          <CopyButton meals={todayMeals} />
          <View style={styles.divider} />
          <ReminderToggle />
        </View>

        <RecentMeals meals={todayMeals} onDelete={loadMeals} />
      </ScrollView>

      {celebrationPalette ? (
        <MotivationOverlay
          visible={celebrationVisible}
          quote={celebrationQuote}
          palette={celebrationPalette}
          onHide={() => setCelebrationVisible(false)}
        />
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
    },
    content: {},
    heroSection: {
      marginBottom: 20,
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
    addMealButton: {
      marginTop: 16,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    addMealButtonContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    addMealButtonText: {
      fontSize: 16,
      fontWeight: "700",
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
