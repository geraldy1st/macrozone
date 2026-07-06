import NavigationGuard from "@/components/NavigationGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { initI18n } from "@/i18n";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n()
      .catch(console.error)
      .finally(() => {
        setReady(true);
        SplashScreen.hideAsync();
      });
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <NavigationGuard />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="welcome" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="login" />
              <Stack.Screen name="verify-email" />
              <Stack.Screen name="auth/callback" />
            </Stack>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}