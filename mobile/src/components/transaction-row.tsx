import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatDate,
  type Account,
  type Category,
  type Transaction,
} from "@asharibook/shared";
import { ArrowLeftRight, MoreHorizontal } from "lucide-react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { Money } from "@/components/ui/money";
import { colors, font } from "@/lib/theme";

export function TransactionRow({
  transaction,
  account,
  category,
  transferAccount,
  perspectiveAccountId,
  onPress,
  onActions,
}: {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  transferAccount?: Account;
  perspectiveAccountId?: string;
  onPress?: () => void;
  onActions?: () => void;
}) {
  const isTransfer = transaction.type === "transfer";
  const title =
    transaction.merchant ||
    (isTransfer && transferAccount
      ? `Transfer to ${transferAccount.name}`
      : category?.name ?? "Transaction");
  const subtitle = isTransfer
    ? `${account?.name ?? "Account"}${
        transferAccount ? ` → ${transferAccount.name}` : ""
      }`
    : `${category?.name ?? "Uncategorized"} · ${account?.name ?? "Account"}`;
  const perspective = perspectiveAccountId ?? transaction.accountId;
  const transferIn =
    isTransfer &&
    transaction.transferAccountId === perspective &&
    transaction.accountId !== perspective;
  const amount =
    transaction.type === "expense" || (isTransfer && !transferIn)
      ? -transaction.amount
      : transaction.amount;
  const amountColor =
    transaction.type === "income"
      ? colors.successDark
      : transaction.type === "transfer"
        ? colors.muted
        : colors.ink;
  const color = category?.color ?? "#5741d8";

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit ${title}`}
        onPress={onPress}
        style={({ pressed }) => [styles.main, pressed && { opacity: 0.72 }]}
      >
        <View style={[styles.icon, { backgroundColor: `${color}14` }]}>
          {isTransfer ? (
            <ArrowLeftRight color={color} size={16} strokeWidth={1.9} />
          ) : (
            <AppIcon name={category?.icon ?? "wallet"} color={color} size={16} />
          )}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {formatDate(transaction.occurredOn)} · {subtitle}
          </Text>
        </View>
        <Money
          value={amount}
          currency={transaction.currency}
          showSign
          size={13}
          color={amountColor}
          display="symbol"
          compact
          compactFrom={1_000_000}
        />
      </Pressable>
      {onActions ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Actions for ${title}`}
          onPress={onActions}
          style={styles.more}
        >
          <MoreHorizontal color={colors.subtle} size={17} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", minHeight: 62 },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 11, paddingVertical: 10 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: font.medium, fontSize: 13, color: colors.ink },
  subtitle: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  more: { width: 34, height: 40, alignItems: "flex-end", justifyContent: "center" },
});
