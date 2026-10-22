import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { supabase } from "@/lib/supabase";
import { colors, font } from "@/lib/theme";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    code?: string;
    token_hash?: string;
    type?: string;
    error_description?: string;
  }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function finish() {
      if (params.error_description) {
        setError(params.error_description);
        return;
      }
      if (!supabase) {
        setError("Supabase is not configured in this build.");
        return;
      }

      try {
        if (params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            params.code,
          );
          if (exchangeError) throw exchangeError;
        } else if (params.token_hash && params.type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash,
            type: params.type as "email" | "signup" | "recovery" | "invite" | "magiclink" | "email_change",
          });
          if (verifyError) throw verifyError;
        } else {
          const { data } = await supabase.auth.getSession();
          if (!data.session) {
            setError("This confirmation link is missing its sign-in details.");
            return;
          }
        }
        if (active) router.replace("/");
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Could not confirm your email.",
          );
        }
      }
    }

    void finish();
    return () => {
      active = false;
    };
  }, [params.code, params.error_description, params.token_hash, params.type]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Logo />
        {!error ? (
          <>
            <ActivityIndicator color={colors.brand} size="large" />
            <Text style={styles.title}>Confirming your account</Text>
            <Text style={styles.description}>One moment while we open your workspace.</Text>
          </>
        ) : (
          <>
            <Text style={styles.title}>Could not confirm</Text>
            <Text style={styles.description}>{error}</Text>
            <Button label="Back to sign in" onPress={() => router.replace("/login")} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 16,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 24,
    letterSpacing: -0.8,
    color: colors.ink,
    textAlign: "center",
  },
  description: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
    textAlign: "center",
  },
});
