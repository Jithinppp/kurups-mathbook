import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useData } from "@/contexts/data";
import { AccountForm } from "@/components/account-form";
import { Button } from "@/components/ui/button";
import { FormShell } from "@/components/ui/form-shell";
import { colors, font } from "@/lib/theme";

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accounts, ready } = useData();
  const account = accounts.find((item) => item.id === id);

  if (!account) {
    return (
      <FormShell title="Account" onCancel={() => router.back()}>
        <View style={styles.empty}>
          <Text style={styles.title}>
            {ready ? "Account not found" : "Loading account…"}
          </Text>
          <Text style={styles.text}>
            {ready
              ? "It may have been removed from another device."
              : "One moment while your workspace syncs."}
          </Text>
          {ready ? <Button label="Back" onPress={() => router.back()} /> : null}
        </View>
      </FormShell>
    );
  }

  return <AccountForm editing={account} />;
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  title: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  text: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
    textAlign: "center",
  },
});
