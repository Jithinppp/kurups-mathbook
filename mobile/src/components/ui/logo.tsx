import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import { colors, font } from "@/lib/theme";

export function Logo({
  tone = "dark",
  showWordmark = true,
  size = 32,
}: {
  tone?: "dark" | "light";
  showWordmark?: boolean;
  size?: number;
}) {
  return (
    <View style={styles.row}>
      <View
        style={[
          styles.mark,
          { width: size, height: size, borderRadius: size * 0.28 },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <Path
            d="M5.5 20.25c2.4 0 2.4-4.1 4.8-4.1s2.4 4.1 4.8 4.1 2.4-4.1 4.8-4.1 2.4 4.1 4.8 4.1 2.4-4.1 4.8-4.1"
            stroke="white"
            strokeWidth="2.15"
            strokeLinecap="round"
          />
          <Circle cx="24.75" cy="11.35" r="1.55" fill="white" fillOpacity="0.9" />
        </Svg>
      </View>
      {showWordmark ? (
        <Text
          style={[
            styles.wordmark,
            { color: tone === "light" ? colors.white : colors.ink },
          ]}
        >
          AshariBook
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  mark: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: colors.brand,
  },
  wordmark: {
    fontFamily: font.semibold,
    fontSize: 18,
    letterSpacing: -0.6,
  },
});
