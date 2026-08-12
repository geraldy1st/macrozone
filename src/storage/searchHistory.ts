import { scopedKey } from "@/storage/scopedKey";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SEARCH_HISTORY_KEY = "communitySearchHistory";
const MAX_HISTORY = 5;

function getKey() {
  return scopedKey(SEARCH_HISTORY_KEY);
}

/** Last N community search queries (A011-2). */
export async function getSearchHistory(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(getKey());
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((q): q is string => typeof q === "string")
      .map((q) => q.trim())
      .filter(Boolean)
      .slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export async function addSearchHistory(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return getSearchHistory();
  }

  const current = await getSearchHistory();
  const next = [
    trimmed,
    ...current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
  ].slice(0, MAX_HISTORY);

  await AsyncStorage.setItem(getKey(), JSON.stringify(next));
  return next;
}

export async function removeSearchHistoryItem(query: string): Promise<string[]> {
  const current = await getSearchHistory();
  const next = current.filter(
    (item) => item.toLowerCase() !== query.trim().toLowerCase(),
  );
  await AsyncStorage.setItem(getKey(), JSON.stringify(next));
  return next;
}

export async function clearSearchHistory(): Promise<void> {
  await AsyncStorage.removeItem(getKey());
}
