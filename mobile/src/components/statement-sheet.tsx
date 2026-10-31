import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { FileSpreadsheet, FileText } from "lucide-react-native";
import {
  buildAccountStatement,
  formatMonth,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";
import { shareStatementPdf, shareStatementXls } from "@/lib/statement-export";

export function StatementSheet({
  visible,
  onClose,
  month,
}: {
  visible: boolean;
  onClose: () => void;
  month: string;
}) {
  const { accounts, categories, transactions, profile } = useData();
  const { selectedAccount } = useAccountSelection();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<"pdf" | "xls" | null>(null);

  const statement = useMemo(
    () =>
      selectedAccount
        ? buildAccountStatement({
            account: selectedAccount,
            accounts,
            categories,
            transactions,
            month,
            holderName: profile.fullName,
          })
        : null,
    [selectedAccount, accounts, categories, transactions, month, profile.fullName],
  );

  if (!selectedAccount || !statement) return null;

  async function handleShare(format: "pdf" | "xls") {
    if (!statement) return;
    setBusy(format);
    try {
      if (format === "pdf") {
        await shareStatementPdf(statement);
      } else {
        await shareStatementXls(statement);
      }
      showToast(`${format === "pdf" ? "PDF" : "Excel"} statement ready`);
      onClose();
    } catch (error) {
      showToast(
        error instanceof Error
          ? error.message
          : "Could not create the statement.",
        "error",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Download statement"
      description={`${selectedAccount.name} · ${formatMonth(month, "long")}`}
    >
      <View style={styles.card}>
        <View style={styles.periodRow}>
          <View style={[styles.icon, { backgroundColor: selectedAccount.color }]}>
            <FileText color={colors.white} size={17} />
          </View>
          <View style={styles.periodCopy}>
            <Text style={styles.period}>{statement.periodLabel}</Text>
            <Text style={styles.meta}>
              {statement.entryCount}{" "}
              {statement.entryCount === 1 ? "entry" : "entries"} ·{" "}
              {statement.currency}
            </Text>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <Summary label="Opening" value={statement.openingBalance} currency={statement.currency} />
          <Summary label="Closing" value={statement.closingBalance} currency={statement.currency} />
          <Summary
            label="Debits"
            value={statement.totalDebits}
            currency={statement.currency}
            color={colors.danger}
          />
          <Summary
            label="Credits"
            value={statement.totalCredits}
            currency={statement.currency}
            color={colors.successDark}
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label={busy === "pdf" ? "Preparing…" : "PDF"}
          variant="primary"
          icon={<FileText color={colors.white} size={15} />}
          loading={busy === "pdf"}
          disabled={busy !== null}
          onPress={() => handleShare("pdf")}
          style={styles.actionButton}
        />
        <Button
          label={busy === "xls" ? "Preparing…" : "Excel (.xls)"}
          variant="secondary"
          icon={<FileSpreadsheet color={colors.ink} size={15} />}
          loading={busy === "xls"}
          disabled={busy !== null}
          onPress={() => handleShare("xls")}
          style={styles.actionButton}
        />
      </View>

      <Text style={styles.note}>
        Only this account&apos;s activity for the selected month is included.
        Fields we don&apos;t store, such as value dates, are left out.
      </Text>
    </Sheet>
  );
}

function Summary({
  label,
  value,
  currency,
  color = colors.ink,
}: {
  label: string;
  value: number;
  currency: string;
  color?: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Money value={value} currency={currency} size={13} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.canvas,
    padding: 14,
  },
  periodRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  periodCopy: { flex: 1 },
  period: {
    fontFamily: font.semibold,
    fontSize: 13,
    color: colors.ink,
  },
  meta: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.muted,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
  },
  summaryCard: {
    width: "48.5%",
    gap: 3,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    padding: 9,
  },
  summaryLabel: {
    fontFamily: font.medium,
    fontSize: 8,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: colors.subtle,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },
  actionButton: { flex: 1 },
  note: {
    marginTop: 12,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.subtle,
  },
});
