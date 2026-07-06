import { getStoredTheme, setStoredTheme } from "@/storage/settings";
import {
  darkTheme,
  lightTheme,
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
  const [mode, setModeState] = useState<ThemeMode>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    getStoredTheme().then((stored) => {
      setModeState(stored ?? (systemScheme === "light" ? "light" : "dark"));
      setIsReady(true);
    });
  }, [systemScheme]);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await setStoredTheme(nextMode);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      colors: mode === "light" ? lightTheme : darkTheme,
      isDark: mode === "dark",
      setMode,
      isReady,
    }),
    [mode, setMode, isReady],
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