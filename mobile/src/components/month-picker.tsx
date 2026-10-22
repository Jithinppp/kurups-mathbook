import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  addMonths,
  currentMonthKey,
  formatMonth,
  monthRange,
} from "@asharibook/shared";
import { CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react-native";

import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

export function MonthPicker({
  month,
  onChange,
}: {
  month: string;
  onChange: (month: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const thisMonth = currentMonthKey();
  const months = useMemo(
    () => monthRange(18, thisMonth).slice().reverse(),
    [thisMonth],
  );

  return (
    <>
      <View style={styles.row}>
        <Pressable
          accessibilityLabel="Previous month"
          onPress={() => onChange(addMonths(month, -1))}
          style={styles.arrow}
        >
          <ChevronLeft color={colors.muted} size={16} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose month"
          onPress={() => setOpen(true)}
          style={styles.pill}
        >
          <CalendarDays color={colors.brand} size={14} />
          <Text style={styles.month}>{formatMonth(month, "short")}</Text>
        </Pressable>
        <Pressable
          accessibilityLabel="Next month"
          disabled={month >= thisMonth}
          onPress={() => onChange(addMonths(month, 1))}
          style={[styles.arrow, month >= thisMonth && styles.disabled]}
        >
          <ChevronRight color={colors.muted} size={16} />
        </Pressable>
      </View>

      <Sheet visible={open} onClose={() => setOpen(false)} title="Choose a month">
        <View style={styles.list}>
          {months.map((item) => {
            const selected = item === month;
            return (
              <Pressable
                key={item}
                onPress={() => {
                  onChange(item);
                  setOpen(false);
                }}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {formatMonth(item, "long")}
                </Text>
                {selected ? (
                  <Check color={colors.brand} size={17} />
                ) : item === thisMonth ? (
                  <Text style={styles.current}>Current</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5 },
  arrow: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  disabled: { opacity: 0.35 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  month: { fontFamily: font.semibold, fontSize: 11, color: colors.ink },
  list: { gap: 6, paddingBottom: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  optionSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  optionText: { fontFamily: font.medium, fontSize: 13, color: colors.ink },
  optionTextSelected: { color: colors.brand, fontFamily: font.semibold },
  current: { fontFamily: font.medium, fontSize: 10, color: colors.subtle },
});
