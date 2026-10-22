import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

import { colors, font, radius } from "@/lib/theme";

export function FormShell({
  title,
  subtitle,
  onCancel,
  onSave,
  saveLabel = "Save",
  saving = false,
  canSave = true,
  error,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onCancel: () => void;
  onSave?: () => void;
  saveLabel?: string;
  saving?: boolean;
  canSave?: boolean;
  error?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onCancel}
          style={styles.close}
        >
          <X color={colors.muted} size={19} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onSave ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            onPress={onSave}
            disabled={saving || !canSave}
            style={[styles.save, (saving || !canSave) && { opacity: 0.45 }]}
          >
            <Text style={styles.saveText}>{saving ? "Saving…" : saveLabel}</Text>
          </Pressable>
        ) : (
          <View style={{ width: 64 }} />
        )}
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.error}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          {children}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    backgroundColor: colors.canvas,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1, minWidth: 0 },
  title: { fontFamily: font.semibold, fontSize: 16, color: colors.ink, letterSpacing: -0.3 },
  subtitle: { marginTop: 1, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  save: {
    minWidth: 64,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  saveText: { fontFamily: font.semibold, fontSize: 12, color: colors.white },
  content: { padding: 18, gap: 16, paddingBottom: 42 },
  error: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { fontFamily: font.medium, fontSize: 11, lineHeight: 16, color: colors.danger },
  footer: { paddingTop: 4 },
});
