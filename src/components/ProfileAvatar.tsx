import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

type ProfileAvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: number;
  backgroundColor: string;
  textColor: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function getAvatarInitials(name?: string | null): string {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) {
    return "?";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0] ?? "";
    const b = parts[1]?.[0] ?? "";
    return `${a}${b}`.toUpperCase() || "?";
  }

  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Circular avatar: remote URL when available, else initials.
 */
export default function ProfileAvatar({
  uri,
  name,
  size = 36,
  backgroundColor,
  textColor,
  style,
  testID,
}: ProfileAvatarProps) {
  const initials = useMemo(() => getAvatarInitials(name), [name]);
  const remote = uri?.trim().startsWith("http") ? uri.trim() : null;
  const fontSize = Math.max(11, Math.round(size * 0.36));

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
      testID={testID}
    >
      {remote ? (
        <Image
          source={{ uri: remote }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          contentFit="cover"
        />
      ) : (
        <Text style={{ color: textColor, fontSize, fontWeight: "800" }}>
          {initials}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
