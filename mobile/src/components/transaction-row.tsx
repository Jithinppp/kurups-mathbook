import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  formatDate,
  type Account,
  type Category,
  type Transaction,
} from "@asharibook/shared";
import { ArrowLeftRight, Pencil } from "lucide-react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

export function TransactionRow({
  transaction,
  account,
  category,
  transferAccount,
  perspectiveAccountId,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  transferAccount?: Account;
  perspectiveAccountId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [detailOpen, setDetailOpen] = useState(false);
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
  const typeLabel =
    transaction.type === "transfer"
      ? "Transfer"
      : transaction.type === "income"
        ? "Income"
        : "Expense";
  const detailCategoryLabel = isTransfer ? "Destination" : "Category";
  const detailCategoryValue = isTransfer
    ? transferAccount?.name ?? "—"
    : category?.name ?? "Uncategorized";

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View transaction: ${title}`}
        onPress={() => setDetailOpen(true)}
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
      {onEdit ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${title}`}
          onPress={onEdit}
          style={({ pressed }) => [styles.edit, pressed && { opacity: 0.7 }]}
        >
          <Pencil color={colors.subtle} size={15} />
        </Pressable>
      ) : null}

      {detailOpen ? (
        <Sheet
          visible
          onClose={() => setDetailOpen(false)}
          title="Transaction details"
          description="A read-only view of this entry."
        >
          <View style={styles.detailBody}>
            <View style={styles.detailCard}>
              <View style={styles.detailTop}>
                <View style={[styles.detailIcon, { backgroundColor: `${color}14` }]}>
                  {isTransfer ? (
                    <ArrowLeftRight color={color} size={18} strokeWidth={1.9} />
                  ) : (
                    <AppIcon
                      name={category?.icon ?? "wallet"}
                      color={color}
                      size={18}
                    />
                  )}
                </View>
                <View style={styles.detailCopy}>
                  <Text style={styles.detailTitle} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={styles.detailSubtitle} numberOfLines={2}>
                    {formatDate(transaction.occurredOn)} · {subtitle}
                  </Text>
                </View>
              </View>
              <Money
                value={amount}
                currency={transaction.currency}
                showSign
                size={24}
                color={amountColor}
                display="symbol"
                compact
                compactFrom={1_000_000}
              />
            </View>

            <View style={styles.detailLines}>
              <DetailLine label="Type" value={typeLabel} />
              <DetailLine
                label={isTransfer ? "From" : "Account"}
                value={account?.name ?? "—"}
              />
              <DetailLine label={detailCategoryLabel} value={detailCategoryValue} />
              <DetailLine label="Currency" value={transaction.currency} />
              <DetailLine label="Date" value={formatDate(transaction.occurredOn)} />
              <DetailLine
                label="Note"
                value={transaction.notes?.trim() || "No note"}
              />
            </View>

            <View style={styles.detailActions}>
              <Button
                label="Close"
                variant="secondary"
                onPress={() => setDetailOpen(false)}
              />
              {onDelete ? (
                <Button
                  label="Delete transaction"
                  variant="danger"
                  onPress={onDelete}
                />
              ) : null}
            </View>
          </View>
        </Sheet>
      ) : null}
    </View>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
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
  edit: { width: 34, height: 40, alignItems: "flex-end", justifyContent: "center" },
  detailBody: { gap: 14, paddingBottom: 8 },
  detailCard: {
    gap: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.canvas,
    padding: 14,
  },
  detailTop: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  detailIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  detailCopy: { flex: 1, minWidth: 0 },
  detailTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  detailSubtitle: {
    marginTop: 3,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.subtle,
  },
  detailLines: { gap: 10 },
  detailLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    paddingBottom: 9,
  },
  detailLabel: {
    fontFamily: font.semibold,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.subtle,
  },
  detailValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: font.medium,
    fontSize: 12,
    lineHeight: 17,
    color: colors.ink,
  },
  detailActions: { gap: 8 },
});
