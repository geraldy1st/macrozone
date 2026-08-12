import {
  CELEBRATION_DURATION_MS,
  type CelebrationPalette,
} from "@/data/celebrationPalettes";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import {
  AccessibilityInfo,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  View,
} from "react-native";

type MotivationOverlayProps = {
  visible: boolean;
  quote: string;
  palette: CelebrationPalette;
  onHide: () => void;
};

/**
 * Full-screen celebration after adding a meal (A011-1).
 * Uses Modal so it covers the entire screen (tabs + system UI margins).
 * pointerEvents="none" so navigation / taps still work underneath once dismissed.
 */
export default function MotivationOverlay({
  visible,
  quote,
  palette,
  onHide,
}: MotivationOverlayProps) {
  useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void AccessibilityInfo.isReduceMotionEnabled().then((reduceMotion) => {
      if (cancelled) {
        return;
      }
      const duration = reduceMotion ? 2000 : CELEBRATION_DURATION_MS;
      timer = setTimeout(() => {
        onHide();
      }, duration);
    });

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [visible, quote, onHide]);

  if (!quote.trim()) {
    return null;
  }

  const { width, height } = Dimensions.get("screen");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      presentationStyle="overFullScreen"
      onRequestClose={onHide}
    >
      <View
        pointerEvents="none"
        style={[styles.root, { width, height }]}
        testID="motivation-overlay"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        <LinearGradient
          colors={palette.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          <Text
            style={[styles.quote, { color: palette.textColor }]}
            testID="motivation-overlay-quote"
          >
            {quote}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  quote: {
    fontSize: 34,
    lineHeight: 44,
    fontWeight: "800",
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: -0.5,
  },
});
