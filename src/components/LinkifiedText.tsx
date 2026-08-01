import { parseTextWithLinks } from "@/utils/linkify";
import { useMemo } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
} from "react-native";

type LinkifiedTextProps = {
  text: string;
  style?: StyleProp<TextStyle>;
  linkStyle?: StyleProp<TextStyle>;
  testID?: string;
};

export default function LinkifiedText({
  text,
  style,
  linkStyle,
  testID,
}: LinkifiedTextProps) {
  const segments = useMemo(() => parseTextWithLinks(text), [text]);

  return (
    <Text style={style} testID={testID}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <Text key={`t-${index}`}>{segment.value}</Text>;
        }

        return (
          <Text
            key={`l-${index}`}
            style={[styles.link, linkStyle]}
            onPress={() => {
              void Linking.openURL(segment.url).catch(() => undefined);
            }}
          >
            {segment.value}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: "underline",
    fontWeight: "700",
  },
});
