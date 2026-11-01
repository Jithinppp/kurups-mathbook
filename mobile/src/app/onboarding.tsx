import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useRouter } from "expo-router";
import {
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Landmark,
  LogOut,
  ShieldCheck,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { AccountType } from "@asharibook/shared";

import { useAuth } from "@/contexts/auth";
import { useData } from "@/contexts/data";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { colors, font, radius, shadow } from "@/lib/theme";

const TYPES: {
  value: AccountType;
  label: string;
  description: string;
  icon: typeof Landmark;
}[] = [
  {
    value: "bank",
    label: "Bank account",
    description: "Salary, savings or a current account.",
    icon: Landmark,
  },
  {
    value: "cash",
    label: "Cash",
    description: "Wallet, drawer or money you hold.",
    icon: Banknote,
  },
  {
    value: "credit_card",
    label: "Credit card",
    description: "Track what you owe and your limit.",
    icon: CreditCard,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { accounts, ready, error, refresh } = useData();
  const [type, setType] = useState<AccountType>("bank");

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

  const selected = TYPES.find((item) => item.value === type) ?? TYPES[0];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Logo />
          <Pressable onPress={() => void signOut()} style={styles.signOut}>
            <LogOut color={colors.muted} size={14} />
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Welcome to AshariBook</Text>
          <Text style={styles.title}>Set up your workspace</Text>
          <Text style={styles.description}>
            Start with the account you actually use. No default wallet, no guessed
            currency. You can add more accounts later.
          </Text>
        </View>

        {error ? (
          <View style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => refresh()} style={styles.retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.list}>
          {TYPES.map((option) => {
            const active = option.value === type;
            const Icon = option.icon;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setType(option.value)}
                style={({ pressed }) => [
                  styles.option,
                  active && styles.optionActive,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                  <Icon color={active ? colors.white : colors.muted} size={19} />
                </View>
                <View style={styles.optionCopy}>
                  <Text style={styles.optionTitle}>{option.label}</Text>
                  <Text style={styles.optionDescription}>{option.description}</Text>
                </View>
                <View style={[styles.check, active && styles.checkActive]}>
                  {active ? <Check color={colors.white} size={12} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button
          label={`Continue with ${selected.label.toLowerCase()}`}
          size="lg"
          onPress={() =>
            router.push(`/onboarding-account?type=${selected.value}`)
          }
          icon={<ArrowRight color={colors.white} size={16} />}
        />

        <View style={styles.note}>
          <ShieldCheck color={colors.brand} size={15} />
          <Text style={styles.noteText}>
            No default Cash account is created. You choose the type, name and
            native currency. AshariBook never converts between currencies.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
  scroll: { padding: 20, gap: 24, paddingBottom: 36 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  signOutText: { fontFamily: font.medium, fontSize: 11, color: colors.muted },
  hero: { gap: 8, paddingTop: 6 },
  eyebrow: {
    fontFamily: font.semibold,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: colors.brand,
  },
  title: {
    fontFamily: font.semibold,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.6,
    color: colors.ink,
  },
  description: {
    fontFamily: font.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
  },
  error: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    padding: 12,
    gap: 6,
  },
  errorText: {
    fontFamily: font.medium,
    fontSize: 11,
    lineHeight: 16,
    color: colors.danger,
  },
  retry: { alignSelf: "flex-start" },
  retryText: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: colors.danger,
    textDecorationLine: "underline",
  },
  list: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 78,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    padding: 14,
    ...shadow.card,
  },
  optionActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  pressed: { opacity: 0.82 },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconActive: { backgroundColor: colors.brand },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: {
    fontFamily: font.semibold,
    fontSize: 14,
    color: colors.ink,
  },
  optionDescription: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 11,
    lineHeight: 16,
    color: colors.subtle,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: { borderColor: colors.brand, backgroundColor: colors.brand },
  note: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 12,
  },
  noteText: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.subtle,
  },
});
