import type { RefObject } from "react";
import { type View } from "react-native";
import { captureRef } from "react-native-view-shot";

export async function captureAndShareSummary(
  viewRef: RefObject<View | null>,
  _dialogTitle: string,
): Promise<void> {
  const dataUri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "data-uri",
  });

  const response = await fetch(dataUri);
  const blob = await response.blob();
  const file = new File([blob], "nutriflow-summary.png", { type: "image/png" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "nutriFlow",
    });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUri;
  link.download = "nutriflow-summary.png";
  link.click();
}