import * as Sharing from "expo-sharing";
import type { RefObject } from "react";
import { Share, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

export type CaptureShareOptions = {
  format?: "png" | "jpg";
  quality?: number;
  mimeType?: string;
};

/**
 * Capture a view and open the system share sheet.
 * Prefer JPEG for lightweight profile/social cards (A010-2).
 */
export async function captureAndShareImage(
  viewRef: RefObject<View | null>,
  dialogTitle: string,
  options?: CaptureShareOptions,
): Promise<void> {
  const format = options?.format ?? "png";
  const quality = options?.quality ?? (format === "jpg" ? 0.85 : 1);
  const mimeType =
    options?.mimeType ?? (format === "jpg" ? "image/jpeg" : "image/png");

  const uri = await captureRef(viewRef, {
    format,
    quality,
    result: "tmpfile",
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType,
      dialogTitle,
    });
    return;
  }

  await Share.share({ url: uri });
}
