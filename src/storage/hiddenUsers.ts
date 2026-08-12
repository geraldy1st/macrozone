import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HIDDEN_USERS_KEY = "hiddenCommunityUsers";

function getKey() {
  return scopedKey(HIDDEN_USERS_KEY);
}

/** User IDs whose posts are hidden from my community feed (A011-2). */
export async function getHiddenUserIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(getKey());
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export async function isUserHidden(userId: string): Promise<boolean> {
  const ids = await getHiddenUserIds();
  return ids.includes(userId);
}

export async function hideUser(userId: string): Promise<void> {
  const ids = await getHiddenUserIds();
  if (ids.includes(userId)) {
    return;
  }
  await AsyncStorage.setItem(getKey(), JSON.stringify([userId, ...ids]));
}

export async function unhideUser(userId: string): Promise<void> {
  const ids = await getHiddenUserIds();
  await AsyncStorage.setItem(
    getKey(),
    JSON.stringify(ids.filter((id) => id !== userId)),
  );
}
