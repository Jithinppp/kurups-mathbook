import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import type { AccountType } from "@asharibook/shared";

import { useAuth } from "@/contexts/auth";
import { useData } from "@/contexts/data";
import { AccountForm } from "@/components/account-form";
import { colors } from "@/lib/theme";

function parseType(value: string | string[] | undefined): AccountType {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "cash" || raw === "credit_card" ? raw : "bank";
}

export default function OnboardingAccountScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string }>();
  const { user, loading: authLoading } = useAuth();
  const { accounts, ready } = useData();

  if (authLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;
  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }
  if (accounts.length > 0) return <Redirect href="/" />;

  return (
    <AccountForm
      defaultType={parseType(params.type)}
      title="Add your first account"
      subtitle="Name it, set the currency and opening balance"
      saveLabel="Create"
      onSaved={() => router.replace("/")}
      onCancel={() => router.replace("/onboarding")}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
});
