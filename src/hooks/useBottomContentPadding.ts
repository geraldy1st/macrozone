import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 56;
const EXTRA_SCROLL_PADDING = 20;

export function useBottomContentPadding(
  extra = EXTRA_SCROLL_PADDING,
  includeTabBar = true,
) {
  const insets = useSafeAreaInsets();
  return insets.bottom + (includeTabBar ? TAB_BAR_HEIGHT : 0) + extra;
}