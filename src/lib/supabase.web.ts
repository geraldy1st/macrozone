import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";
import Constants from "expo-constants";
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
 * Expo web SSR runs on Node 20 without native WebSocket.
 * Only load `ws` in that Node context — never on native app bundles.
 */
function ensureWebSocketPolyfill(): typeof WebSocket | undefined {
  if (typeof globalThis.WebSocket !== "undefined") {
    return globalThis.WebSocket;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const WS = require("ws") as typeof WebSocket;
    // @ts-expect-error assign Node `ws` for Supabase Realtime during SSR
    globalThis.WebSocket = WS;
    return WS;
  } catch {
    return undefined;
  }
}

const ssrMemoryStorage = new Map<string, string>();

const storageAdapter = {
  getItem: async (key: string) => {
    if (!isBrowser) {
      return ssrMemoryStorage.get(key) ?? null;
    }
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (!isBrowser) {
      ssrMemoryStorage.set(key, value);
      return;
    }
    await AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (!isBrowser) {
      ssrMemoryStorage.delete(key);
      return;
    }
    await AsyncStorage.removeItem(key);
  },
};

function getRealtimeOptions(): SupabaseClientOptions["realtime"] {
  const transport = ensureWebSocketPolyfill();
  return transport ? { transport } : undefined;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: storageAdapter,
        autoRefreshToken: isBrowser,
        persistSession: isBrowser,
        detectSessionInUrl: isBrowser,
        flowType: "pkce",
      },
      realtime: getRealtimeOptions(),
    })
  : null;
