import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { formatCompact } from "@asharibook/shared";

import { colors, font } from "@/lib/theme";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  total,
  currency,
  centerLabel,
}: {
  segments: DonutSegment[];
  total: number;
  currency: string;
  centerLabel?: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  return (
    <View style={styles.root}>
      <View style={styles.chart}>
        <Svg width={140} height={140} viewBox="0 0 140 140">
          <G transform="rotate(-90 70 70)">
            <Circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={colors.lineSoft}
              strokeWidth={13}
            />
            {segments.map((segment, index) => {
              const fraction = total > 0 ? segment.value / total : 0;
              const length = fraction * circumference;
              const offset = segments
                .slice(0, index)
                .reduce(
                  (sum, item) =>
                    sum + (total > 0 ? item.value / total : 0) * circumference,
                  0,
                );
              const dash = `${Math.max(0, length - 2)} ${circumference}`;
              return (
                <Circle
                  key={segment.label}
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={13}
                  strokeDasharray={dash}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.center} pointerEvents="none">
          <Text style={styles.centerLabel}>{centerLabel ?? "Spent"}</Text>
          <Text style={styles.centerValue}>{formatCompact(total, currency)}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {segments.slice(0, 5).map((segment) => (
          <View key={segment.label} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {segment.label}
            </Text>
            <Text style={styles.legendValue}>{Math.round((segment.value / Math.max(1, total)) * 100)}%</Text>
          </View>
        ))}
        {segments.length === 0 ? (
          <Text style={styles.empty}>No spending this month.</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: 16 },
  chart: { width: 140, height: 140, alignItems: "center", justifyContent: "center" },
  center: { position: "absolute", alignItems: "center", paddingHorizontal: 24 },
  centerLabel: {
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.subtle,
  },
  centerValue: {
    marginTop: 3,
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
    textAlign: "center",
  },
  legend: { flex: 1, gap: 7 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendLabel: { flex: 1, fontFamily: font.regular, fontSize: 10, color: colors.muted },
  legendValue: { fontFamily: font.semibold, fontSize: 10, color: colors.ink },
  empty: { fontFamily: font.regular, fontSize: 11, color: colors.subtle },
});
