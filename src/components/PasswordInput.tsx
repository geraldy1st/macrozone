import { useTheme } from "@/contexts/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from "react-native";

type PasswordInputProps = TextInputProps & {
  testID?: string;
};

export default function PasswordInput({
  testID,
  style,
  ...props
}: PasswordInputProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <TextInput
        {...props}
        style={[styles.input, style]}
        secureTextEntry={!visible}
        testID={testID}
        placeholderTextColor={colors.textSecondary}
      />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setVisible((current) => !current)}
        testID={testID ? `${testID}-toggle` : undefined}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"]) {
  return StyleSheet.create({
    wrapper: {
      position: "relative",
    },
    input: {
      backgroundColor: colors.surface,
      color: colors.text,
      padding: 16,
      paddingRight: 48,
      borderRadius: 12,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    toggle: {
      position: "absolute",
      right: 12,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      paddingHorizontal: 4,
    },
  });
}