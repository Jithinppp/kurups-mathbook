import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { colors, font, radius } from "@/lib/theme";

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        variants[variant].container,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variants[variant].text.color} size="small" />
      ) : (
        icon
      )}
      <Text style={[styles.label, variants[variant].text]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function IconButton({
  children,
  onPress,
  label,
  variant = "light",
}: {
  children: ReactNode;
  onPress: () => void;
  label: string;
  variant?: "light" | "dark" | "brand";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        variant === "dark" && { backgroundColor: colors.ink },
        variant === "brand" && { backgroundColor: colors.brand },
        pressed && styles.pressed,
      ]}
    >
      {children}
    </Pressable>
  );
}

const variants = {
  primary: {
    container: { backgroundColor: colors.brand },
    text: { color: colors.white },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
    },
    text: { color: colors.ink },
  },
  ghost: {
    container: { backgroundColor: "transparent" },
    text: { color: colors.muted },
  },
  danger: {
    container: { backgroundColor: colors.dangerSoft },
    text: { color: colors.danger },
  },
  dark: {
    container: { backgroundColor: colors.ink },
    text: { color: colors.white },
  },
} as const;

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: radius.md,
  },
  sm: { minHeight: 34, paddingHorizontal: 12 },
  md: { minHeight: 44, paddingHorizontal: 16 },
  lg: { minHeight: 52, paddingHorizontal: 20 },
  label: { fontFamily: font.semibold, fontSize: 13 },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
});

export function ButtonRow({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: "row", gap: 10 }}>{children}</View>;
}
