import * as Sharing from "expo-sharing";
import { Share, type View } from "react-native";
import { captureRef } from "react-native-view-shot";
import type { RefObject } from "react";

export async function captureAndShareSummary(
  viewRef: RefObject<View | null>,
  dialogTitle: string,
): Promise<void> {
  const uri = await captureRef(viewRef, {
    format: "png",
    quality: 1,
    result: "tmpfile",
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      dialogTitle,
    });
    return;
  }

  await Share.share({ url: uri });
}