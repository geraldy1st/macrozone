import { useThemedStyles } from "@/hooks/useThemedStyles";
import type { ThemeColors } from "@/styles/themes";
import { StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import ProgressBar from "./ProgressBar";

type MacroCardProps = {
  label: string;
  current: number;
  goal: number;
  color: string;
  unit?: string;
  variant?: "hero" | "compact";
};

export default function MacroCard({
  label,
  current,
  goal,
  color,
  unit = "",
  variant = "compact",
}: MacroCardProps) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const progress = goal > 0 ? current / goal : 0;
  const percent = Math.round(Math.min(progress, 1) * 100);
  const isHero = variant === "hero";

  return (
    <View style={[styles.card, isHero && styles.heroCard]}>
      <View style={styles.header}>
        <Text
          style={[styles.label, isHero && styles.heroLabel]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
          <Text style={[styles.badgeText, { color }]}>{percent}%</Text>
        </View>
      </View>

      <Text
        style={[styles.value, isHero && styles.heroValue]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {current.toLocaleString()}
        {unit}
      </Text>

      <Text style={styles.goal} numberOfLines={1}>
        {t("macros.ofGoal", {
          goal: `${goal.toLocaleString()}${unit}`,
        })}
      </Text>

      <ProgressBar
        progress={progress}
        color={color}
        height={isHero ? 12 : 6}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    flex: 1,
    minWidth: 0,
  },
  heroCard: {
    width: "100%",
    padding: 18,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  heroLabel: {
    fontSize: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  value: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 30,
    marginBottom: 4,
  },
  goal: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  });
}