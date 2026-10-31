import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, ArrowRight, Mail, MailCheck } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { colors, font, radius } from "@/lib/theme";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    if (!email.trim()) {
      setError("Enter the email you use for AshariBook.");
      return;
    }
    if (!configured) {
      setError("Supabase is not configured in this build.");
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not send the reset email.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.confirm}>
          <View style={styles.confirmIcon}>
            <MailCheck color={colors.success} size={28} />
          </View>
          <Text style={styles.confirmTitle}>Check your inbox</Text>
          <Text style={styles.confirmText}>
            If an AshariBook account exists for {sentTo}, we sent a password
            reset link. Open it to choose a new password.
          </Text>
          <Text style={styles.confirmHint}>
            It can take a minute to arrive. Check spam or promotions if you
            don’t see it.
          </Text>
          <Button
            label="Use a different email"
            variant="secondary"
            onPress={() => setSentTo(null)}
          />
          <Button
            label="Back to sign in"
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
          <Pressable onPress={() => router.back()} style={styles.back}>
            <ArrowLeft color={colors.muted} size={18} />
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Logo />
          <View style={{ gap: 8 }}>
            <Text style={styles.eyebrow}>Account recovery</Text>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.description}>
              Enter the email you use for AshariBook. We’ll send a secure link
              to choose a new password.
            </Text>
          </View>

          <View style={styles.card}>
            <Field label="Email">
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            </Field>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label="Send reset link"
              onPress={handleSubmit}
              loading={loading}
              disabled={!configured}
              icon={<ArrowRight color={colors.white} size={16} />}
            />
          </View>

          <Pressable onPress={() => router.replace("/login")} style={styles.footer}>
            <Text style={styles.footerText}>
              Remembered it? <Text style={styles.footerLink}>Sign in</Text>
            </Text>
          </Pressable>

          <View style={styles.securityNote}>
            <Mail color={colors.subtle} size={14} />
            <Text style={styles.securityText}>
              For your security, we don’t reveal whether an email is registered.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: 22, gap: 24, paddingBottom: 40 },
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
  footer: { alignItems: "center" },
  footerText: { fontFamily: font.regular, fontSize: 12, color: colors.muted },
  footerLink: { fontFamily: font.semibold, color: colors.brand },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    paddingHorizontal: 6,
  },
  securityText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.subtle,
  },
  confirm: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
    gap: 14,
  },
  confirmIcon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.successSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmTitle: {
    fontFamily: font.semibold,
    fontSize: 26,
    letterSpacing: -1,
    color: colors.ink,
    textAlign: "center",
  },
  confirmText: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
  },
  confirmHint: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.subtle,
    textAlign: "center",
  },
});
