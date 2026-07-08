import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity } from "react-native";

const FAVORITE_COLOR = "#FFD700";

type FavoriteStarProps = {
  isFavorite: boolean;
  onPress: () => void;
  size?: number;
  testID?: string;
};

export default function FavoriteStar({
  isFavorite,
  onPress,
  size = 22,
  testID,
}: FavoriteStarProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      testID={testID}
      style={styles.button}
    >
      <Ionicons
        name={isFavorite ? "star" : "star-outline"}
        size={size}
        color={FAVORITE_COLOR}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 4,
  },
});