import type { RefObject } from "react";
import { type View } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { CaptureShareOptions } from "./shareImage.native";

export type { CaptureShareOptions };

export async function captureAndShareImage(
  viewRef: RefObject<View | null>,
  _dialogTitle: string,
  options?: CaptureShareOptions,
): Promise<void> {
  const format = options?.format ?? "png";
  const quality = options?.quality ?? (format === "jpg" ? 0.85 : 1);
  const mimeType =
    options?.mimeType ?? (format === "jpg" ? "image/jpeg" : "image/png");
  const ext = format === "jpg" ? "jpg" : "png";

  const dataUri = await captureRef(viewRef, {
    format,
    quality,
    result: "data-uri",
  });

  const response = await fetch(dataUri);
  const blob = await response.blob();
  const file = new File([blob], `nutriflow-share.${ext}`, { type: mimeType });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "nutriFlow",
    });
    return;
  }

  const link = document.createElement("a");
  link.href = dataUri;
  link.download = `nutriflow-share.${ext}`;
  link.click();
}
