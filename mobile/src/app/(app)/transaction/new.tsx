import { useLocalSearchParams } from "expo-router";

import { TransactionForm } from "@/components/transaction-form";

export default function NewTransactionScreen() {
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();

  return <TransactionForm defaultAccountId={accountId} />;
}
