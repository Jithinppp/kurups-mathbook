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
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowRight, LockKeyhole, Mail, Sparkles } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/auth";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { colors, font, radius } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    reset?: string;
    error?: string;
    deleted?: string;
  }>();
  const { signIn, enterDemo, resendConfirmation, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const notice =
    params.reset === "1"
      ? "Password updated. Sign in with your new password."
      : params.deleted === "1"
        ? "Your account and all workspace data were permanently deleted."
        : typeof params.error === "string"
          ? authErrorMessage(params.error)
          : null;
  const noticeIsError = Boolean(params.error);

  async function handleSignIn() {
    setError(null);
    setCanResend(false);
    setResendMessage(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Could not sign in.";
      if (message.toLowerCase().includes("email not confirmed")) {
        setCanResend(true);
        setError("Confirm your email first, then sign in.");
      } else if (message.toLowerCase().includes("invalid login")) {
        setError("That email and password don't match.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email.trim()) return;
    setResendLoading(true);
    setResendMessage(null);
    try {
      await resendConfirmation(email);
      setResendMessage(
        "Confirmation email sent. Check your inbox and spam folder.",
      );
    } catch (caught) {
      setResendMessage(
        caught instanceof Error ? caught.message : "Could not resend the email.",
      );
    } finally {
      setResendLoading(false);
    }
  }

  async function handleDemo() {
    setDemoLoading(true);
    setError(null);
    try {
      await enterDemo();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not open the demo.");
    } finally {
      setDemoLoading(false);
    }
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
          <View style={styles.hero}>
            <Logo />
            <View style={styles.badge}>
              <Sparkles color={colors.brand} size={13} />
              <Text style={styles.badgeText}>Personal finance, without the noise</Text>
            </View>
            <Text style={styles.title}>Every dirham,{"\n"}accounted for.</Text>
            <Text style={styles.description}>
              One account at a time. Native currencies, calm budgets and a clear
              view of the month ahead.
            </Text>
          </View>

          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>Welcome back</Text>
              <Text style={styles.cardDescription}>
                Sign in to your AshariBook workspace.
              </Text>
            </View>

            <Field label="Email">
              <View style={styles.inputRow}>
                <Mail color={colors.subtle} size={16} />
                <Input
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  style={styles.input}
                />
              </View>
            </Field>
            <Field label="Password">
              <View style={styles.inputRow}>
                <LockKeyhole color={colors.subtle} size={16} />
                <Input
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="password"
                  placeholder="Your password"
                  style={styles.input}
                />
              </View>
            </Field>

            <Pressable
              onPress={() => router.push("/forgot-password")}
              style={styles.forgot}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {notice ? (
              <Text style={noticeIsError ? styles.error : styles.notice}>
                {notice}
              </Text>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {canResend ? (
              <View style={styles.resend}>
                <Button
                  label="Resend confirmation email"
                  variant="secondary"
                  size="sm"
                  onPress={handleResend}
                  loading={resendLoading}
                />
                {resendMessage ? (
                  <Text style={styles.resendMessage}>{resendMessage}</Text>
                ) : null}
              </View>
            ) : null}

            <Button
              label="Sign in"
              onPress={handleSignIn}
              loading={loading}
              icon={<ArrowRight color={colors.white} size={16} />}
            />

            <View style={styles.divider}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.line} />
            </View>

            <Button
              label="Open demo workspace"
              variant="secondary"
              onPress={handleDemo}
              loading={demoLoading}
            />
            {!configured ? (
              <Text style={styles.note}>
                Supabase isn’t configured in this build. The demo works fully
                offline.
              </Text>
            ) : null}
          </View>

          <Pressable onPress={() => router.push("/signup")} style={styles.footer}>
            <Text style={styles.footerText}>
              New to AshariBook? <Text style={styles.footerLink}>Create an account</Text>
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
  hero: { paddingTop: 20, gap: 16 },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  badgeText: { fontFamily: font.medium, fontSize: 10, color: colors.brand },
  title: {
    fontFamily: font.semibold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -2,
    color: colors.ink,
  },
  description: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    maxWidth: 320,
  },
  card: {
    gap: 16,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    padding: 20,
  },
  cardTitle: {
    fontFamily: font.semibold,
    fontSize: 20,
    letterSpacing: -0.6,
    color: colors.ink,
  },
  cardDescription: {
    marginTop: 3,
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.muted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingLeft: 13,
  },
  input: { flex: 1, borderWidth: 0, minHeight: 44, paddingLeft: 0 },
  error: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.danger,
  },
  notice: {
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: font.medium,
    fontSize: 12,
    color: colors.success,
  },
  forgot: { alignSelf: "flex-end", marginTop: -6 },
  forgotText: { fontFamily: font.medium, fontSize: 11, color: colors.brand },
  resend: { gap: 7 },
  resendMessage: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.muted,
  },
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  line: { flex: 1, height: 1, backgroundColor: colors.lineSoft },
  dividerText: { fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  note: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.subtle,
    textAlign: "center",
  },
  footer: { alignItems: "center", paddingVertical: 4 },
  footerText: { fontFamily: font.regular, fontSize: 12, color: colors.muted },
  footerLink: { fontFamily: font.semibold, color: colors.brand },
});

function authErrorMessage(code: string) {
  switch (code) {
    case "expired":
      return "That email link has expired or was already used. Request a new one.";
    case "access_denied":
      return "That email link was cancelled or has already been used.";
    case "recovery":
      return "That password reset link is invalid or has expired.";
    case "confirmation":
      return "We couldn't confirm that email link. Request a new email.";
    case "auth_callback":
      return "We couldn't complete that sign-in link. It may have expired.";
    default:
      return "We couldn't complete that sign-in link. Please try again.";
  }
}
