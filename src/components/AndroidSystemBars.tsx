import { useTheme } from "@/contexts/ThemeContext";
import * as NavigationBar from "expo-navigation-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Android only: prefer a non-intrusive system navigation bar so app UI
 * (e.g. Settings legal links) stays tappable. Content padding is handled
 * by useBottomContentPadding. Gesture nav can still reveal the bar.
 */
export default function AndroidSystemBars() {
  const { isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    void (async () => {
      try {
        await NavigationBar.setButtonStyleAsync(isDark ? "light" : "dark");
      } catch {
        // Optional API — ignore failures (edge-to-edge / Expo Go).
      }

      try {
        // Best-effort: reduce permanent overlay; OS may re-show via gesture.
        await NavigationBar.setVisibilityAsync("hidden");
      } catch {
        // ignore
      }
    })();
  }, [isDark]);

  return null;
}
