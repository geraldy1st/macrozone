import { StyleSheet } from "react-native";

export const colors = {
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
};

export const macroColors = {
  accent: "#ff6b35",
  calories: "#ff6b35",
  protein: "#4ecdc4",
  carbs: "#ffd93d",
  fat: "#6bcb77",
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginTop: 30,
    marginBottom: 16,
  },
  empty: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textSecondary: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 30,
  },
});