import { useState, type CSSProperties } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { CalendarDays } from "lucide-react-native";
import { formatDate, toISODate } from "@asharibook/shared";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = new Date(`${value}T12:00:00`);

  function handleChange(_event: unknown, selected?: Date) {
    if (Platform.OS === "android") setOpen(false);
    if (selected) onChange(toISODate(selected));
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === "web" ? (
        <View style={styles.row}>
          <CalendarDays color={colors.brand} size={16} />
          <Text style={styles.value}>{formatDate(value, "long")}</Text>
          <input
            type="date"
            value={value}
            aria-label={label}
            onChange={(event) => {
              if (event.currentTarget.value) {
                onChange(event.currentTarget.value);
              }
            }}
            style={webInput}
          />
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={() => setOpen(true)}
          style={styles.row}
        >
          <CalendarDays color={colors.brand} size={16} />
          <Text style={styles.value}>{formatDate(value, "long")}</Text>
        </Pressable>
      )}

      {Platform.OS === "ios" ? (
        <Sheet visible={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={handleChange}
            themeVariant="light"
          />
          <Button label="Done" onPress={() => setOpen(false)} />
        </Sheet>
      ) : open ? (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontFamily: font.medium, fontSize: 12, color: colors.ink },
  row: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  value: { flex: 1, fontFamily: font.medium, fontSize: 13, color: colors.ink },
});

const webInput: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: "100%",
  height: "100%",
  border: "none",
  margin: 0,
  padding: 0,
  opacity: 0,
  cursor: "pointer",
  zIndex: 1,
};
