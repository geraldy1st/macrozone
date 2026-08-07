import type { RefObject } from "react";
import type { View } from "react-native";
import { captureAndShareImage } from "./shareImage.web";

export async function captureAndShareSummary(
  viewRef: RefObject<View | null>,
  dialogTitle: string,
): Promise<void> {
  await captureAndShareImage(viewRef, dialogTitle, {
    format: "png",
    quality: 1,
  });
}
