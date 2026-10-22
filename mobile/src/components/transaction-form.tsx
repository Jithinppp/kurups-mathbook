import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Plus,
  Wallet,
} from "lucide-react-native";
import {
  ACCOUNT_TYPE_LABEL,
  todayISO,
  type Transaction,
  type TransactionType,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { FormShell } from "@/components/ui/form-shell";
import { Segmented } from "@/components/ui/segmented";
import { SelectRow } from "@/components/ui/select-row";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

type Picker = "account" | "category" | "transfer" | null;

const TYPES: { value: TransactionType; label: string; icon: React.ReactNode }[] = [
  { value: "expense", label: "Expense", icon: <ArrowUpRight color={colors.muted} size={14} /> },
  { value: "income", label: "Income", icon: <ArrowDownLeft color={colors.muted} size={14} /> },
  {
    value: "transfer",
    label: "Transfer",
    icon: <ArrowLeftRight color={colors.muted} size={14} />,
  },
];

export function TransactionForm({ editing }: { editing?: Transaction | null }) {
  const router = useRouter();
  const { accounts, categories, addTransaction, updateTransaction, deleteTransaction } =
    useData();
  const { selectedAccountId, setSelectedAccountId } = useAccountSelection();
  const { showToast } = useToast();

  const active = useMemo(
    () =>
      accounts.filter(
        (account) =>
          !account.isArchived ||
          account.id === editing?.accountId ||
          account.id === editing?.transferAccountId,
      ),
    [accounts, editing],
  );

  const initialAccountId =
    editing?.accountId ??
    (active.some((account) => account.id === selectedAccountId)
      ? selectedAccountId
      : active[0]?.id ?? "");
  const initialCurrency = active.find((account) => account.id === initialAccountId)?.currency;

  const [type, setType] = useState<TransactionType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [accountId, setAccountId] = useState(initialAccountId);
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ??
      categories.find((category) => category.kind === (editing?.type ?? "expense"))?.id ??
      "",
  );
  const [transferAccountId, setTransferAccountId] = useState(
    editing?.transferAccountId ??
      active.find(
        (account) =>
          account.id !== initialAccountId && account.currency === initialCurrency,
      )?.id ??
      "",
  );
  const [occurredOn, setOccurredOn] = useState(editing?.occurredOn ?? todayISO());
  const [merchant, setMerchant] = useState(editing?.merchant ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [picker, setPicker] = useState<Picker>(null);

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );
  const sourceAccount = active.find((account) => account.id === accountId);
  const destinationAccount = active.find((account) => account.id === transferAccountId);
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const sameCurrencyAccounts = active.filter(
    (account) => account.id !== accountId && account.currency === sourceAccount?.currency,
  );
  const currency = sourceAccount?.currency ?? "AED";

  function changeAccount(nextId: string) {
    setAccountId(nextId);
    setError(null);
    if (type !== "transfer") return;
    const nextCurrency = active.find((account) => account.id === nextId)?.currency;
    const currentDestination = active.find(
      (account) => account.id === transferAccountId,
    );
    if (
      !currentDestination ||
      currentDestination.id === nextId ||
      currentDestination.currency !== nextCurrency
    ) {
      setTransferAccountId(
        active.find(
          (account) => account.id !== nextId && account.currency === nextCurrency,
        )?.id ?? "",
      );
    }
  }

  function changeType(next: TransactionType) {
    setType(next);
    setError(null);
    if (next !== "transfer") {
      const first = categories.find((category) => category.kind === next);
      setCategoryId(first?.id ?? "");
    } else {
      const sourceCurrency = active.find((account) => account.id === accountId)?.currency;
      const destination = active.find((account) => account.id === transferAccountId);
      if (
        !destination ||
        destination.id === accountId ||
        destination.currency !== sourceCurrency
      ) {
        setTransferAccountId(
          active.find(
            (account) =>
              account.id !== accountId && account.currency === sourceCurrency,
          )?.id ?? "",
        );
      }
    }
  }

  async function handleSave() {
    setError(null);
    const numericAmount = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!sourceAccount) {
      setError("Choose an account.");
      return;
    }
    if (!occurredOn || !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
      setError("Choose a valid date.");
      return;
    }
    if (type === "transfer") {
      if (!destinationAccount) {
        setError(
          sameCurrencyAccounts.length
            ? "Choose the account receiving the transfer."
            : `Add another ${sourceAccount.currency} account to make a transfer.`,
        );
        return;
      }
      if (destinationAccount.id === sourceAccount.id) {
        setError("Choose two different accounts.");
        return;
      }
      if (destinationAccount.currency !== sourceAccount.currency) {
        setError(
          `Transfers stay within ${sourceAccount.currency}. Choose another ${sourceAccount.currency} account.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      const input = {
        accountId: sourceAccount.id,
        categoryId: type === "transfer" ? null : categoryId || null,
        type,
        amount: numericAmount,
        currency: sourceAccount.currency,
        occurredOn,
        merchant:
          merchant.trim() ||
          (type === "transfer" && destinationAccount
            ? `Transfer to ${destinationAccount.name}`
            : type === "income"
              ? "Income"
              : "Expense"),
        notes: notes.trim() || null,
        transferAccountId:
          type === "transfer" ? destinationAccount?.id ?? null : null,
      };

      if (editing) {
        await updateTransaction(editing.id, input);
        showToast("Transaction updated");
      } else {
        await addTransaction(input);
        showToast(type === "transfer" ? "Transfer recorded" : "Transaction added");
      }
      setSelectedAccountId(sourceAccount.id);
      router.back();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save transaction.",
      );
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!editing) return;
    Alert.alert(
      "Delete transaction?",
      "This entry will be removed from your ledger. It cannot be undone.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteTransaction(editing.id);
              showToast("Transaction deleted");
              router.back();
            } catch (caught) {
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Could not delete transaction.",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  if (!active.length) {
    return (
      <FormShell
        title={editing ? "Edit transaction" : "New transaction"}
        onCancel={() => router.back()}
      >
        <EmptyState
          icon={<Wallet color={colors.brand} size={22} />}
          title="Add an account first"
          description="Transactions always belong to a bank account, cash source or credit card."
          action={
            <Button
              label="Add account"
              icon={<Plus color={colors.white} size={15} />}
              onPress={() => {
                router.back();
                router.push("/account/new");
              }}
            />
          }
        />
      </FormShell>
    );
  }

  return (
    <FormShell
      title={editing ? "Edit transaction" : "New transaction"}
      subtitle={
        sourceAccount
          ? `${sourceAccount.name} · ${sourceAccount.currency}`
          : undefined
      }
      onCancel={() => router.back()}
      onSave={handleSave}
      saveLabel={editing ? "Save" : type === "transfer" ? "Transfer" : "Add"}
      saving={saving}
      error={error}
      footer={
        editing ? (
          <Button label="Delete transaction" variant="danger" onPress={confirmDelete} />
        ) : null
      }
    >
      <Segmented options={TYPES} value={type} onChange={changeType} />

      <Field label="Amount">
        <View style={styles.amountRow}>
          <View style={styles.currencyTag}>
            <Text style={styles.currencyCode}>{currency}</Text>
          </View>
          <Input
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            style={styles.amountInput}
            autoFocus={!editing}
          />
        </View>
      </Field>

      <SelectRow
        label="From account"
        value={sourceAccount ? `${sourceAccount.name} · ${sourceAccount.currency}` : ""}
        placeholder="Choose account"
        onPress={() => setPicker("account")}
        icon={
          sourceAccount ? (
            <AppIcon name={sourceAccount.icon} color={sourceAccount.color} size={15} />
          ) : (
            <Wallet color={colors.subtle} size={15} />
          )
        }
      />

      {type === "transfer" ? (
        <SelectRow
          label="To account"
          value={
            destinationAccount
              ? `${destinationAccount.name} · ${destinationAccount.currency}`
              : ""
          }
          placeholder={
            sameCurrencyAccounts.length
              ? `Choose ${currency} account`
              : `No other ${currency} account`
          }
          onPress={() => setPicker("transfer")}
          disabled={!sameCurrencyAccounts.length}
          icon={
            destinationAccount ? (
              <AppIcon
                name={destinationAccount.icon}
                color={destinationAccount.color}
                size={15}
              />
            ) : (
              <ArrowLeftRight color={colors.subtle} size={15} />
            )
          }
        />
      ) : (
        <SelectRow
          label="Category"
          value={selectedCategory?.name}
          placeholder="Choose category"
          onPress={() => setPicker("category")}
          icon={
            selectedCategory ? (
              <AppIcon
                name={selectedCategory.icon}
                color={selectedCategory.color}
                size={15}
              />
            ) : (
              <Wallet color={colors.subtle} size={15} />
            )
          }
        />
      )}

      {type === "transfer" && !sameCurrencyAccounts.length ? (
        <Text style={styles.hint}>
          Add another account in {currency} before transferring. AshariBook never
          converts currencies.
        </Text>
      ) : null}

      <DateField label="Date" value={occurredOn} onChange={setOccurredOn} />

      <Field label={type === "transfer" ? "Description" : "Merchant or title"}>
        <Input
          value={merchant}
          onChangeText={setMerchant}
          placeholder={
            type === "transfer" && destinationAccount
              ? `Transfer to ${destinationAccount.name}`
              : type === "income"
                ? "e.g. Salary"
                : "e.g. Carrefour"
          }
          autoCapitalize="sentences"
        />
      </Field>

      <Field label="Notes" hint="optional">
        <Input
          value={notes}
          onChangeText={setNotes}
          placeholder="Anything worth remembering"
          multiline
        />
      </Field>

      <Sheet
        visible={picker === "account"}
        onClose={() => setPicker(null)}
        title="Choose source account"
      >
        <View style={styles.optionList}>
          {active.map((account) => (
            <Pressable
              key={account.id}
              onPress={() => {
                changeAccount(account.id);
                setPicker(null);
              }}
              style={[
                styles.accountOption,
                account.id === accountId && styles.optionActive,
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${account.color}16` }]}>
                <AppIcon name={account.icon} color={account.color} size={17} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>{account.name}</Text>
                <Text style={styles.optionMeta}>
                  {ACCOUNT_TYPE_LABEL[account.type]} · {account.currency}
                </Text>
              </View>
              <Text style={styles.optionCurrency}>{account.currency}</Text>
            </Pressable>
          ))}
        </View>
      </Sheet>

      <Sheet
        visible={picker === "transfer"}
        onClose={() => setPicker(null)}
        title={`Transfer within ${currency}`}
        description="Only accounts in the same currency can receive this transfer."
      >
        <View style={styles.optionList}>
          {sameCurrencyAccounts.length ? (
            sameCurrencyAccounts.map((account) => (
              <Pressable
                key={account.id}
                onPress={() => {
                  setTransferAccountId(account.id);
                  setPicker(null);
                }}
                style={[
                  styles.accountOption,
                  account.id === transferAccountId && styles.optionActive,
                ]}
              >
                <View style={[styles.optionIcon, { backgroundColor: `${account.color}16` }]}>
                  <AppIcon name={account.icon} color={account.color} size={17} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionTitle}>{account.name}</Text>
                  <Text style={styles.optionMeta}>{account.currency}</Text>
                </View>
              </Pressable>
            ))
          ) : (
            <Text style={styles.hint}>
              No other {currency} accounts. Add one before making a transfer.
            </Text>
          )}
        </View>
      </Sheet>

      <Sheet
        visible={picker === "category"}
        onClose={() => setPicker(null)}
        title="Choose category"
      >
        <View style={styles.optionList}>
          <Pressable
            onPress={() => {
              setCategoryId("");
              setPicker(null);
            }}
            style={[styles.accountOption, !categoryId && styles.optionActive]}
          >
            <View style={[styles.optionIcon, { backgroundColor: colors.canvas }]}>
              <Wallet color={colors.subtle} size={16} />
            </View>
            <Text style={styles.optionTitle}>Uncategorized</Text>
          </Pressable>
          {categoryOptions.map((category) => (
            <Pressable
              key={category.id}
              onPress={() => {
                setCategoryId(category.id);
                setPicker(null);
              }}
              style={[
                styles.accountOption,
                category.id === categoryId && styles.optionActive,
              ]}
            >
              <View style={[styles.optionIcon, { backgroundColor: `${category.color}16` }]}>
                <AppIcon name={category.icon} color={category.color} size={16} />
              </View>
              <Text style={styles.optionTitle}>{category.name}</Text>
            </Pressable>
          ))}
          {!categoryOptions.length ? (
            <Text style={styles.hint}>
              No {type} categories yet. Add one in Settings.
            </Text>
          ) : null}
        </View>
      </Sheet>
    </FormShell>
  );
}

const styles = StyleSheet.create({
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingLeft: 10,
    paddingRight: 12,
  },
  currencyTag: {
    borderRadius: 8,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  currencyCode: { fontFamily: font.semibold, fontSize: 10, color: colors.brand },
  amountInput: {
    flex: 1,
    borderWidth: 0,
    minHeight: 56,
    paddingHorizontal: 0,
    fontFamily: font.semibold,
    fontSize: 26,
    letterSpacing: -1,
  },
  hint: {
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: 11,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.warning,
  },
  optionList: { gap: 7, paddingBottom: 8 },
  accountOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  optionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  optionTitle: { fontFamily: font.semibold, fontSize: 12, color: colors.ink },
  optionMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 9, color: colors.subtle },
  optionCurrency: { fontFamily: font.semibold, fontSize: 9, color: colors.subtle },
});
