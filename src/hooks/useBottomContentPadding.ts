import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_HEIGHT = 56;
const EXTRA_SCROLL_PADDING = 20;
/** Floor for system gesture / 3-button nav when insets under-report on Android. */
const ANDROID_MIN_SYSTEM_BOTTOM = 28;

export function useBottomContentPadding(
  extra = EXTRA_SCROLL_PADDING,
  includeTabBar = true,
) {
  const insets = useSafeAreaInsets();
  const systemBottom =
    Platform.OS === "android"
      ? Math.max(insets.bottom, ANDROID_MIN_SYSTEM_BOTTOM)
      : insets.bottom;

  return systemBottom + (includeTabBar ? TAB_BAR_HEIGHT : 0) + extra;
}
