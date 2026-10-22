import type { ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";

import { colors, font, radius } from "@/lib/theme";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.hint}> · {hint}</Text> : null}
      </Text>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.subtle}
      {...props}
      style={[styles.input, props.multiline && styles.multiline, props.style]}
    />
  );
}

export function PickerButton({
  value,
  placeholder,
  onPress,
  disabled,
}: {
  value?: string;
  placeholder: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Text
      accessibilityRole="button"
      onPress={disabled ? undefined : onPress}
      style={[
        styles.input,
        styles.picker,
        !value && { color: colors.subtle },
        disabled && { opacity: 0.5 },
      ]}
    >
      {value || placeholder}
    </Text>
  );
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: {
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.ink,
  },
  hint: { color: colors.subtle, fontFamily: font.regular },
  input: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: colors.ink,
    fontFamily: font.medium,
    fontSize: 14,
  },
  multiline: { minHeight: 84, textAlignVertical: "top" },
  picker: { lineHeight: 22 },
});
