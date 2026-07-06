import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { setAuthenticatedOnboarding } from "@/storage/onboarding";
import { createSessionFromUrl } from "@/utils/authSession";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";

async function resolveCallbackUrl() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.href;
  }

  return Linking.getInitialURL();
}

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const completeAuth = async (incomingUrl?: string | null) => {
      try {
        const url = incomingUrl ?? (await resolveCallbackUrl());

        if (!url) {
          router.replace("/login");
          return;
        }

        const session = await createSessionFromUrl(url);

        if (session) {
          await setAuthenticatedOnboarding();
          showToast(t("auth.callbackSuccessMessage"), "success");
          router.replace("/(tabs)");
          return;
        }

        router.replace("/login");
      } catch {
        showToast(t("auth.callbackErrorMessage"), "error");
        router.replace("/login");
      }
    };

    completeAuth();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      completeAuth(url);
    });

    return () => {
      subscription.remove();
    };
  }, [router, showToast, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});