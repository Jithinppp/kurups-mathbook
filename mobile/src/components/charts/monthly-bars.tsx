import { StyleSheet, Text, View } from "react-native";
import { formatCompact, formatMonth, type MonthPoint } from "@asharibook/shared";

import { colors, font } from "@/lib/theme";

export function MonthlyBars({
  data,
  selectedMonth,
  currency,
}: {
  data: MonthPoint[];
  selectedMonth: string;
  currency: string;
}) {
  const max = Math.max(1, ...data.flatMap((point) => [point.expenses, point.income]));
  return (
    <View>
      <View style={styles.legend}>
        <Legend color={colors.brand} label="Expenses" />
        <Legend color="#9ed8bd" label="Income" />
      </View>
      <View style={styles.chart}>
        {data.map((point) => {
          const selected = point.month === selectedMonth;
          return (
            <View key={point.month} style={styles.column}>
              <View style={styles.bars}>
                <View
                  style={[
                    styles.bar,
                    styles.expenseBar,
                    { height: Math.max(4, (point.expenses / max) * 132) },
                    selected && { backgroundColor: colors.brand },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    styles.incomeBar,
                    { height: Math.max(4, (point.income / max) * 132) },
                  ]}
                />
              </View>
              <Text style={[styles.month, selected && styles.monthSelected]}>
                {formatMonth(point.month, "short").split(" ")[0]}
              </Text>
              {selected ? (
                <Text style={styles.selectedValue}>
                  {formatCompact(point.expenses, currency).replace(currency, "").trim()}
                </Text>
              ) : (
                <View style={{ height: 12 }} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", gap: 14, marginBottom: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontFamily: font.medium, fontSize: 9, color: colors.muted },
  chart: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 178 },
  column: { flex: 1, alignItems: "center", justifyContent: "flex-end", gap: 5 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 136 },
  bar: { width: 8, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  expenseBar: { backgroundColor: "#c9b8ff" },
  incomeBar: { backgroundColor: "#c6ead9" },
  month: { fontFamily: font.medium, fontSize: 9, color: colors.subtle },
  monthSelected: { color: colors.ink, fontFamily: font.semibold },
  selectedValue: { fontFamily: font.semibold, fontSize: 8, color: colors.muted },
});
