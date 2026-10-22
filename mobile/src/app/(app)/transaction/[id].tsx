import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { useData } from "@/contexts/data";
import { Button } from "@/components/ui/button";
import { FormShell } from "@/components/ui/form-shell";
import { TransactionForm } from "@/components/transaction-form";
import { colors, font } from "@/lib/theme";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { transactions, ready } = useData();
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return (
      <FormShell title="Transaction" onCancel={() => router.back()}>
        <View style={styles.empty}>
          <Text style={styles.title}>
            {ready ? "Transaction not found" : "Loading transaction…"}
          </Text>
          <Text style={styles.text}>
            {ready
              ? "It may have been deleted from another device."
              : "One moment while your workspace syncs."}
          </Text>
          {ready ? <Button label="Back" onPress={() => router.back()} /> : null}
        </View>
      </FormShell>
    );
  }

  return <TransactionForm editing={transaction} />;
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
