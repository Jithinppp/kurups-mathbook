import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown } from "lucide-react-native";

import { colors, font, radius } from "@/lib/theme";

export function SelectRow({
  label,
  value,
  placeholder,
  onPress,
  icon,
  hint,
  disabled = false,
}: {
  label: string;
  value?: string | null;
  placeholder: string;
  onPress: () => void;
  icon?: ReactNode;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}> · {hint}</Text> : null}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [
          styles.row,
          pressed && !disabled && { opacity: 0.78 },
          disabled && { opacity: 0.5 },
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        <Text
          style={[styles.value, !value && styles.placeholder]}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <ChevronDown color={colors.subtle} size={16} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontFamily: font.medium, fontSize: 12, color: colors.ink },
  hint: { color: colors.subtle, fontFamily: font.regular },
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
  icon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { flex: 1, fontFamily: font.medium, fontSize: 13, color: colors.ink },
  placeholder: { color: colors.subtle },
});
