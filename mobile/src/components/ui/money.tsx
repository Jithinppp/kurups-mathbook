import { StyleSheet, Text, View } from "react-native";
import { formatNumber } from "@asharibook/shared";

import { colors, font } from "@/lib/theme";

export function Money({
  value,
  currency,
  showSign = false,
  color = colors.ink,
  size = 16,
  weight = "semibold",
}: {
  value: number;
  currency: string;
  showSign?: boolean;
  color?: string;
  size?: number;
  weight?: "regular" | "medium" | "semibold" | "bold";
}) {
  const negative = value < 0;
  const prefix = showSign ? (negative ? "−" : "+") : negative ? "−" : "";
  const family =
    weight === "regular"
      ? font.regular
      : weight === "medium"
        ? font.medium
        : weight === "bold"
          ? font.bold
          : font.semibold;
  return (
    <View style={styles.row}>
      <Text style={[styles.amount, { color, fontFamily: family, fontSize: size }]}>
        {prefix}
      </Text>
      <Text
        style={[
          styles.code,
          {
            color,
            fontFamily: family,
            fontSize: Math.max(9, size * 0.62),
          },
        ]}
      >
        {currency}
      </Text>
      <Text style={[styles.amount, { color, fontFamily: family, fontSize: size }]}>
        {formatNumber(Math.abs(value), 2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  amount: { fontVariant: ["tabular-nums"], letterSpacing: -0.4 },
  code: { fontWeight: "600", letterSpacing: 0.3, opacity: 0.72 },
});
