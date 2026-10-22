import { Pressable, StyleSheet, Text, View } from "react-native";
import type { BudgetRow as BudgetRowData } from "@asharibook/shared";
import { ChevronRight } from "lucide-react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress";
import { colors, font } from "@/lib/theme";

export function BudgetRow({
  row,
  onPress,
}: {
  row: BudgetRowData;
  onPress: () => void;
}) {
  const budgeted = Boolean(row.budget);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.category.name} budget`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.72 }]}
    >
      <View style={[styles.icon, { backgroundColor: `${row.category.color}14` }]}>
        <AppIcon name={row.category.icon} color={row.category.color} size={17} />
      </View>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={styles.name} numberOfLines={1}>
            {row.category.name}
          </Text>
          {budgeted ? (
            <Money value={row.budget!.amount} currency={row.currency} size={12} />
          ) : (
            <Text style={styles.unbudgeted}>No budget</Text>
          )}
        </View>
        {budgeted ? (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                {row.overspent ? "Over by " : "Left "}
                <Money
                  value={Math.abs(row.remaining)}
                  currency={row.currency}
                  size={10}
                  color={row.overspent ? colors.danger : colors.muted}
                />
              </Text>
              <Text style={styles.meta}>
                {Math.round(row.progress)}% spent
              </Text>
            </View>
            <ProgressBar
              value={row.progress}
              color={row.overspent ? colors.danger : row.category.color}
              height={6}
            />
          </>
        ) : (
          <Text style={styles.hint}>
            Spent <Money value={row.spent} currency={row.currency} size={10} /> · Tap to set a plan
          </Text>
        )}
      </View>
      <ChevronRight color={colors.subtle} size={16} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    minHeight: 72,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 4, minWidth: 0 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { fontFamily: font.regular, fontSize: 10, color: colors.muted },
  unbudgeted: { fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  hint: { fontFamily: font.regular, fontSize: 10, color: colors.subtle },
});
