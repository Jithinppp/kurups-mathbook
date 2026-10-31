import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { colors, font, radius } from "@/lib/theme";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { user, loading, configured, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don’t match.");
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      await signOut();
      // Let the auth state clear before the auth layout evaluates the route.
      setTimeout(() => router.replace("/login?reset=1"), 0);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update your password.",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} size="large" />
          <Text style={styles.description}>Checking your reset link…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!configured || !user) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <View style={styles.invalidIcon}>
            <KeyRound color={colors.danger} size={28} />
          </View>
          <Text style={styles.invalidTitle}>Reset link expired</Text>
          <Text style={styles.invalidDescription}>
            This password reset link is invalid or has expired. Request a new one
            to continue.
          </Text>
          <Button
            label="Request a new link"
            onPress={() => router.replace("/forgot-password")}
            icon={<ArrowRight color={colors.white} size={16} />}
          />
          <Button
            label="Back to sign in"
            variant="secondary"
            onPress={() => router.replace("/login")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.replace("/login")} style={styles.back}>
            <ArrowLeft color={colors.muted} size={18} />
            <Text style={styles.backText}>Back to sign in</Text>
          </Pressable>
          <Logo />
          <View style={{ gap: 8 }}>
            <Text style={styles.eyebrow}>Account recovery</Text>
            <Text style={styles.title}>Choose a new password</Text>
            <Text style={styles.description}>
              Use at least 8 characters. You’ll sign in again with the new
              password.
            </Text>
          </View>

          <View style={styles.card}>
            <Field label="New password" hint="8+ characters">
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Choose a new password"
                secureTextEntry
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <Input
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat the password"
                secureTextEntry
                autoComplete="new-password"
              />
            </Field>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label="Update password"
              onPress={handleSubmit}
              loading={saving}
              icon={<ArrowRight color={colors.white} size={16} />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: 22, gap: 24, paddingBottom: 40 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  backText: { fontFamily: font.medium, fontSize: 12, color: colors.muted },
  eyebrow: {
    fontFamily: font.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.brand,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1.5,
    color: colors.ink,
  },
  description: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  invalidTitle: {
    fontFamily: font.semibold,
    fontSize: 30,
    lineHeight: 36,
    letterSpacing: -1.4,
    color: colors.ink,
    textAlign: "center",
  },
  invalidDescription: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
  },
  card: {
    gap: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    padding: 20,
  },
  error: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.danger,
  },
  invalidIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
