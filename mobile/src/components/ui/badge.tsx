import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font, radius } from "@/lib/theme";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "danger" | "warning";
}) {
  return (
    <View style={[styles.badge, tones[tone].container]}>
      <Text style={[styles.text, tones[tone].text]}>{children}</Text>
    </View>
  );
}

const tones = {
  neutral: { container: { backgroundColor: colors.canvas }, text: { color: colors.muted } },
  brand: { container: { backgroundColor: colors.brandSoft }, text: { color: colors.brand } },
  success: { container: { backgroundColor: colors.successSoft }, text: { color: colors.successDark } },
  danger: { container: { backgroundColor: colors.dangerSoft }, text: { color: colors.danger } },
  warning: { container: { backgroundColor: colors.warningSoft }, text: { color: colors.warning } },
} as const;

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: { fontFamily: font.semibold, fontSize: 10, letterSpacing: 0.5, textTransform: "uppercase" },
});
