import MainTabBar from "@/components/MainTabBar";
import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="add-meals" options={{ title: t("tabs.addMeals") }} />
      <Tabs.Screen name="community" options={{ title: t("tabs.community") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabs.profile") }} />
      <Tabs.Screen
        name="meals"
        options={{
          href: null,
          title: t("tabs.allMeals"),
        }}
      />
    </Tabs>
  );
}
