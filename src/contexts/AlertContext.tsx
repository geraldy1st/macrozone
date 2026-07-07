import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import i18n from "i18next";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type AlertButtonStyle = "default" | "cancel" | "destructive";

export type AlertButton = {
  text: string;
  style?: AlertButtonStyle;
  onPress?: () => void;
};

type AlertState = {
  title: string;
  message?: string;
  buttons: AlertButton[];
};

type AlertContextValue = {
  showAlert: (options: {
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }) => void;
};

const AlertContext = createContext<AlertContextValue | null>(null);

const defaultButtons = (close: () => void): AlertButton[] => [
  { text: i18n.t("common.ok"), onPress: close },
];

export function AlertProvider({ children }: { children: ReactNode }) {
  const { colors, isDark } = useTheme();
  const [alert, setAlert] = useState<AlertState | null>(null);

  const closeAlert = useCallback(() => {
    setAlert(null);
  }, []);

  const showAlert = useCallback(
    ({
      title,
      message,
      buttons,
    }: {
      title: string;
      message?: string;
      buttons?: AlertButton[];
    }) => {
      setAlert({
        title,
        message,
        buttons: buttons?.length ? buttons : defaultButtons(closeAlert),
      });
    },
    [closeAlert],
  );

  const handlePress = (button: AlertButton) => {
    closeAlert();
    button.onPress?.();
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Modal
        visible={alert !== null}
        transparent
        animationType="fade"
        onRequestClose={closeAlert}
      >
        <Pressable
          style={[
            styles.backdrop,
            { backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(15,23,42,0.45)" },
          ]}
          onPress={closeAlert}
        >
          <Pressable
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
              },
            ]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.iconRow}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: `${colors.primary}22` },
                ]}
              >
                <Ionicons
                  name="information-circle"
                  size={22}
                  color={colors.primary}
                />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {alert?.title}
              </Text>
            </View>

            {alert?.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {alert.message}
              </Text>
            ) : null}

            <View style={styles.buttons}>
              {alert?.buttons.map((button, index) => {
                const isDestructive = button.style === "destructive";
                const isCancel = button.style === "cancel";

                return (
                  <TouchableOpacity
                    key={`${button.text}-${index}`}
                    style={[
                      styles.button,
                      isCancel && {
                        backgroundColor: colors.surface,
                        borderColor: colors.cardBorder,
                        borderWidth: 1,
                      },
                      isDestructive && {
                        backgroundColor: `${colors.alert}18`,
                        borderColor: `${colors.alert}55`,
                        borderWidth: 1,
                      },
                      !isCancel &&
                        !isDestructive && {
                          backgroundColor: colors.accent,
                        },
                    ]}
                    onPress={() => handlePress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        isCancel && { color: colors.text },
                        isDestructive && { color: colors.alert },
                        !isCancel &&
                          !isDestructive && { color: colors.background },
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within AlertProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
  },
  buttons: {
    gap: 10,
    marginTop: 4,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
});