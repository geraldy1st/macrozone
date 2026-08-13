import { useAuth } from "@/contexts/AuthContext";
import { getUserProfile } from "@/storage/profile";
import { resolveDisplayAvatarUri } from "@/utils/avatar";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { usePathname } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

type TabProfileIconProps = {
  color: string;
  size: number;
  focused: boolean;
};

export default function TabProfileIcon({
  color,
  size,
  focused,
}: TabProfileIconProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const loadPhoto = useCallback(async () => {
    if (!user) {
      setPhotoUri(null);
      return;
    }

    try {
      const profile = await getUserProfile();
      setPhotoUri(resolveDisplayAvatarUri(profile.photoUri));
    } catch {
      setPhotoUri(null);
    }
  }, [user]);

  useEffect(() => {
    void loadPhoto();
  }, [loadPhoto, pathname]);

  if (user && photoUri) {
    const diameter = size + 2;
    return (
      <View
        style={[
          styles.ring,
          {
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            borderColor: focused ? color : "transparent",
          },
        ]}
      >
        <Image
          source={{ uri: photoUri }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <Ionicons
      name={focused ? "person-circle" : "person-circle-outline"}
      size={size}
      color={color}
    />
  );
}

const styles = StyleSheet.create({
  ring: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    overflow: "hidden",
  },
});
