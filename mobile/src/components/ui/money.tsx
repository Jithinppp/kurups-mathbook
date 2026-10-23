import { StyleSheet, Text, View } from "react-native";
import { currencySymbol, formatCompactNumber, formatNumber } from "@asharibook/shared";

import { colors, font } from "@/lib/theme";

export function Money({
  value,
  currency,
  showSign = false,
  color = colors.ink,
  size = 16,
  weight = "semibold",
  display = "code",
  compact = false,
  compactFrom = 100_000,
}: {
  value: number;
  currency: string;
  showSign?: boolean;
  color?: string;
  size?: number;
  weight?: "regular" | "medium" | "semibold" | "bold";
  display?: "code" | "symbol";
  compact?: boolean;
  compactFrom?: number;
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
  const amount =
    compact && Math.abs(value) >= compactFrom
      ? formatCompactNumber(value, currency)
      : formatNumber(Math.abs(value), 2);
  const currencyLabel = display === "symbol" ? currencySymbol(currency) : currency;

  return (
    <View style={styles.row}>
      <Text style={[styles.amount, { color, fontFamily: family, fontSize: size }]}>
        {prefix}
      </Text>
      <Text
        numberOfLines={1}
        style={[
          styles.code,
          {
            color,
            fontFamily: family,
            fontSize: Math.max(9, size * 0.64),
          },
        ]}
      >
        {currencyLabel}
      </Text>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.72}
        style={[styles.amount, { color, fontFamily: family, fontSize: size }]}
      >
        {amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  amount: { fontVariant: ["tabular-nums"], letterSpacing: -0.4 },
  code: { fontWeight: "600", letterSpacing: 0.3, opacity: 0.72 },
});
