import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/lib/theme";

export function ProgressBar({
  value,
  color = colors.brand,
  track = colors.lineSoft,
  height = 7,
}: {
  value: number;
  color?: string;
  track?: string;
  height?: number;
}) {
  return (
    <View style={[styles.track, { backgroundColor: track, height }]}>
      <View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: `${Math.min(100, Math.max(0, value))}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: "100%", borderRadius: radius.pill, overflow: "hidden" },
  fill: { height: "100%", borderRadius: radius.pill },
});
