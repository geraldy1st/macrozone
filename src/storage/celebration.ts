import AsyncStorage from "@react-native-async-storage/async-storage";
import { scopedKey } from "@/storage/scopedKey";

const PENDING_KEY = "pendingMotivationCelebration";

function getPendingKey() {
  return scopedKey(PENDING_KEY);
}

/** Mark that Home should show the full-screen motivation overlay once. */
export async function setPendingCelebration(): Promise<void> {
  await AsyncStorage.setItem(getPendingKey(), "1");
}

/** Returns true once if a celebration was pending, then clears the flag. */
export async function consumePendingCelebration(): Promise<boolean> {
  const key = getPendingKey();
  const value = await AsyncStorage.getItem(key);
  if (value !== "1") {
    return false;
  }
  await AsyncStorage.removeItem(key);
  return true;
}
