import { Image } from "expo-image";
import { StyleSheet } from "react-native";

type AppLogoProps = {
  size?: number;
};

export default function AppLogo({ size = 36 }: AppLogoProps) {
  return (
    <Image
      source={require("../../assets/images/splash-icon.png")}
      style={[styles.logo, { width: size, height: size }]}
      contentFit="contain"
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    borderRadius: 0,
  },
});