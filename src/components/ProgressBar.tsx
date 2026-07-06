import { useTheme } from "@/contexts/ThemeContext";
import { StyleSheet, View } from "react-native";

type ProgressBarProps = {
  progress: number;
  color: string;
  height?: number;
};

export default function ProgressBar({
  progress,
  color,
  height = 8,
}: ProgressBarProps) {
  const { colors } = useTheme();
  const clampedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View style={[styles.track, { height, backgroundColor: colors.surface }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 999,
  },
});