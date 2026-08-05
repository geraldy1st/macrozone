import { Ionicons } from "@expo/vector-icons";
import ImageViewing from "react-native-image-viewing";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ImageZoomViewerProps = {
  visible: boolean;
  imageUri: string | null | undefined;
  onClose: () => void;
};

/**
 * Full-screen pinch-zoom image viewer for community / meal photos.
 */
export default function ImageZoomViewer({
  visible,
  imageUri,
  onClose,
}: ImageZoomViewerProps) {
  const insets = useSafeAreaInsets();
  const uri = imageUri?.trim() ?? "";

  return (
    <ImageViewing
      images={uri ? [{ uri }] : []}
      imageIndex={0}
      visible={visible && Boolean(uri)}
      onRequestClose={onClose}
      swipeToCloseEnabled
      doubleTapToZoomEnabled
      HeaderComponent={() => (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close"
            testID="image-zoom-close"
          >
            <Ionicons name="close" size={26} color="#ffffff" />
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    alignItems: "flex-end",
    paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});
