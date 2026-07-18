import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  Constants.expoConfig?.extra?.supabaseUrl ??
  "";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  Constants.expoConfig?.extra?.supabaseAnonKey ??
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** True only in a real browser (false during Expo web SSR on Node). */
const isBrowser = typeof window !== "undefined";

/**
 * Expo web SSR runs on Node 20, which has no native WebSocket.
 * Supabase Realtime requires one at client creation time.
 */
function ensureWebSocketPolyfill(): typeof WebSocket | undefined {
  if (typeof globalThis.WebSocket !== "undefined") {
    return globalThis.WebSocket;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WS = require("ws") as typeof WebSocket;
    // @ts-expect-error assign Node `ws` as global WebSocket for Supabase Realtime
    globalThis.WebSocket = WS;
    return WS;
  } catch {
    return undefined;
  }
}

/** In-memory storage used only during SSR (no `window` / localStorage). */
const ssrMemoryStorage = new Map<string, string>();

const storageAdapter = {
  getItem: async (key: string) => {
    if (!isBrowser) {
      return ssrMemoryStorage.get(key) ?? null;
    }

    if (Platform.OS === "web") {
      return AsyncStorage.getItem(key);
    }

    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (!isBrowser) {
      ssrMemoryStorage.set(key, value);
      return;
    }

    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (!isBrowser) {
      ssrMemoryStorage.delete(key);
      return;
    }

    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};

function getRealtimeOptions(): SupabaseClientOptions["realtime"] {
  const transport = ensureWebSocketPolyfill();

  if (!transport) {
    return undefined;
  }

  return { transport };
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: storageAdapter,
        // Avoid touching browser-only storage / timers during SSR.
        autoRefreshToken: isBrowser,
        persistSession: isBrowser,
        detectSessionInUrl: isBrowser && Platform.OS === "web",
        flowType: "pkce",
      },
      realtime: getRealtimeOptions(),
    })
  : null;
