import { colors } from "@/styles/global";
import { createSessionFromUrl } from "@/utils/authSession";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const completeAuth = async () => {
      try {
        if (Platform.OS === "web" && typeof window !== "undefined") {
          await createSessionFromUrl(window.location.href);
        }

        router.replace("/(tabs)");
      } catch {
        router.replace("/login");
      }
    };

    completeAuth();
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});