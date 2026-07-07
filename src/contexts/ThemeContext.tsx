import { getStoredTheme, setStoredTheme } from "@/storage/settings";
import {
  darkTheme,
  lightTheme,
  resolveThemeMode,
  type ThemeColors,
  type ThemeMode,
} from "@/styles/themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

type ThemeContextValue = {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  isReady: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getStoredTheme().then((stored) => {
      setModeState(stored ?? "system");
      setIsReady(true);
    });
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await setStoredTheme(nextMode);
  }, []);

  const resolvedMode = resolveThemeMode(mode, systemScheme);

  const value = useMemo(
    () => ({
      mode,
      colors: resolvedMode === "light" ? lightTheme : darkTheme,
      isDark: resolvedMode === "dark",
      setMode,
      isReady,
    }),
    [mode, resolvedMode, setMode, isReady],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }

  return context;
}