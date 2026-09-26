import TabProfileIcon from "@/components/TabProfileIcon";
import { useTheme } from "@/contexts/ThemeContext";
import { TAB_BAR_HEIGHT } from "@/hooks/useBottomContentPadding";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const current = state.routes[state.index]?.name;
  const journalFocused = current === "index";
  const historyFocused = current === "meals";

  const open = (name: string) => {
    const route = state.routes.find((item) => item.name === name);
    if (!route) {
      return;
    }
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.cardBorder,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {renderSideTab({
        name: "index",
        label: t("tabs.home"),
        testID: "home-tab",
        focused: journalFocused,
        color: journalFocused ? colors.primary : colors.textSecondary,
        onPress: () => open("index"),
        icon: (
          <Ionicons
            name="book-outline"
            size={22}
            color={journalFocused ? colors.primary : colors.textSecondary}
          />
        ),
      })}

      {renderSideTab({
        name: "meals",
        label: t("tabs.allMeals"),
        testID: "all-meals-tab",
        focused: historyFocused,
        color: historyFocused ? colors.primary : colors.textSecondary,
        onPress: () => open("meals"),
        icon: (
          <Ionicons
            name="time-outline"
            size={22}
            color={historyFocused ? colors.primary : colors.textSecondary}
          />
        ),
      })}

      <TouchableOpacity
        style={styles.fabSlot}
        onPress={() => open("add-meals")}
        testID="add-meals-tab"
        accessibilityRole="button"
        accessibilityLabel={t("tabs.addMeals")}
        activeOpacity={0.85}
      >
        <View style={[styles.fab, { backgroundColor: colors.accent }]}>
          <Ionicons name="add" size={30} color={colors.background} />
        </View>
      </TouchableOpacity>

      {renderSideTab({
        name: "community",
        label: t("tabs.community"),
        testID: "community-tab",
        focused: current === "community",
        color:
          current === "community" ? colors.primary : colors.textSecondary,
        onPress: () => open("community"),
        icon: (
          <Ionicons
            name="compass-outline"
            size={22}
            color={
              current === "community" ? colors.primary : colors.textSecondary
            }
          />
        ),
      })}

      {renderSideTab({
        name: "profile",
        label: t("tabs.profile"),
        testID: "profile-tab",
        focused: current === "profile",
        color: current === "profile" ? colors.primary : colors.textSecondary,
        onPress: () => open("profile"),
        icon: (
          <TabProfileIcon
            color={
              current === "profile" ? colors.primary : colors.textSecondary
            }
            size={22}
            focused={current === "profile"}
          />
        ),
      })}
    </View>
  );
}

function renderSideTab({
  name,
  label,
  testID,
  focused,
  color,
  onPress,
  icon,
}: {
  name: string;
  label: string;
  testID: string;
  focused: boolean;
  color: string;
  onPress: () => void;
  icon: ReactNode;
}) {
  return (
    <TouchableOpacity
      key={name}
      style={styles.slot}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      activeOpacity={0.7}
    >
      {icon}
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 6,
    overflow: "visible",
  },
  slot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: TAB_BAR_HEIGHT - 8,
    gap: 2,
  },
  fabSlot: {
    width: 64,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    shadowColor: "#ff6b35",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
  },
});
