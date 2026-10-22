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
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { colors, font, radius } from "@/lib/theme";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (!name.trim()) return setError("Enter your name.");
    if (!email.trim()) return setError("Enter your email.");
    if (password.length < 6) return setError("Use at least 6 characters for your password.");
    setLoading(true);
    try {
      const result = await signUp(name, email, password);
      if (result.needsConfirmation) setConfirmation(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmation) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.confirm}>
          <View style={styles.confirmIcon}>
            <CheckCircle2 color={colors.success} size={28} />
          </View>
          <Text style={styles.confirmTitle}>Check your email</Text>
          <Text style={styles.confirmText}>
            We sent a confirmation link to {email}. Open it on this device to
            finish creating your AshariBook workspace.
          </Text>
          <Button label="Back to sign in" onPress={() => router.replace("/login")} />
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
            <Text style={styles.title}>Create your workspace</Text>
            <Text style={styles.description}>
              Start with a clean ledger, native currencies and budgets that reset
              every month.
            </Text>
          </View>

          <View style={styles.card}>
            <Field label="Your name">
              <Input value={name} onChangeText={setName} placeholder="Jithin" autoCapitalize="words" />
            </Field>
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
            <Field label="Password" hint="6+ characters">
              <Input
                value={password}
                onChangeText={setPassword}
                placeholder="Choose a password"
                secureTextEntry
                autoComplete="new-password"
              />
            </Field>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {!configured ? (
              <Text style={styles.error}>Supabase is not configured in this build.</Text>
            ) : null}
            <Button
              label="Create account"
              onPress={handleSignUp}
              loading={loading}
              disabled={!configured}
              icon={<ArrowRight color={colors.white} size={16} />}
            />
          </View>

          <Pressable onPress={() => router.replace("/login")} style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account? <Text style={styles.footerLink}>Sign in</Text>
            </Text>
          </Pressable>
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
    marginBottom: 8,
  },
});
