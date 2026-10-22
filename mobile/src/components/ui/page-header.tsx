import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors, font } from "@/lib/theme";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      {actions ? <View style={styles.actions}>{actions}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  copy: { gap: 3 },
  eyebrow: {
    fontFamily: font.semibold,
    fontSize: 10,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: colors.brand,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 28,
    letterSpacing: -1.1,
    color: colors.ink,
  },
  description: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.muted,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
});
