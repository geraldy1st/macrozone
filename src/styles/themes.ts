export type ThemeColors = {
  background: string;
  header: string;
  surface: string;
  card: string;
  cardBorder: string;
  primary: string;
  accent: string;
  text: string;
  textSecondary: string;
  alert: string;
  toastSuccess: string;
  toastError: string;
  toastInfo: string;
};

export const macroColors = {
  accent: "#ff6b35",
  calories: "#ff6b35",
  protein: "#4ecdc4",
  carbs: "#ffd93d",
  fat: "#6bcb77",
};

export const darkTheme: ThemeColors = {
  background: "#0f0f1a",
  header: "#1a1a2e",
  surface: "#1e1e32",
  card: "#16162a",
  cardBorder: "#2a2a4a",
  primary: "#4fc3f7",
  accent: "#ff6b35",
  text: "#ffffff",
  textSecondary: "#8b8ba0",
  alert: "#ff5252",
  toastSuccess: "#1f4d3b",
  toastError: "#4d1f1f",
  toastInfo: "#1f3550",
};

export const lightTheme: ThemeColors = {
  background: "#f4f6fb",
  header: "#ffffff",
  surface: "#ffffff",
  card: "#ffffff",
  cardBorder: "#d8deea",
  primary: "#0288d1",
  accent: "#e65100",
  text: "#1a1f36",
  textSecondary: "#5c667d",
  alert: "#d32f2f",
  toastSuccess: "#e8f5e9",
  toastError: "#ffebee",
  toastInfo: "#e3f2fd",
};

export type ThemeMode = "system" | "dark" | "light";

export function resolveThemeMode(
  mode: ThemeMode,
  systemScheme: "light" | "dark" | null | undefined,
): "light" | "dark" {
  if (mode === "system") {
    return systemScheme === "light" ? "light" : "dark";
  }

  return mode;
}