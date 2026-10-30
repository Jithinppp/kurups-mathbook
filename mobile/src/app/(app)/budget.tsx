import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Sparkles, Wallet } from "lucide-react-native";
import {
  currentMonthKey,
  formatMoney,
  formatMonth,
  monthStart,
  SUGGESTED_BUDGETS,
  type BudgetInput,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { AppIcon } from "@/components/ui/app-icon";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { FormShell } from "@/components/ui/form-shell";
import { SelectRow } from "@/components/ui/select-row";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

export default function BudgetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    month?: string;
    accountId?: string;
    categoryId?: string;
    budgetId?: string;
  }>();
  const { accounts, categories, budgets, setBudget, deleteBudget } = useData();
  const { selectedAccountId } = useAccountSelection();
  const { showToast } = useToast();

  const month = params.month || currentMonthKey();
  const accountId = params.accountId || selectedAccountId;
  const account = accounts.find((item) => item.id === accountId);
  const currency = account?.currency ?? "AED";
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.kind === "expense"),
    [categories],
  );
  const initialCategoryId =
    params.categoryId ||
    expenseCategories.find(
      (category) =>
        !budgets.some(
          (budget) =>
            budget.accountId === accountId &&
            budget.categoryId === category.id &&
            budget.month === monthStart(month),
        ),
    )?.id ||
    expenseCategories[0]?.id ||
    "";
  const initialBudget = budgets.find(
    (budget) =>
      budget.accountId === accountId &&
      budget.categoryId === initialCategoryId &&
      budget.month === monthStart(month),
  );

  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [amount, setAmount] = useState(
    initialBudget ? String(initialBudget.amount) : "",
  );
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedCategory = expenseCategories.find(
    (category) => category.id === categoryId,
  );
  const existingBudget = budgets.find(
    (budget) =>
      budget.accountId === accountId &&
      budget.categoryId === categoryId &&
      budget.month === monthStart(month),
  );
  const suggestion = selectedCategory
    ? SUGGESTED_BUDGETS[currency]?.[selectedCategory.name]
    : undefined;

  function chooseCategory(nextId: string) {
    setCategoryId(nextId);
    const existing = budgets.find(
      (budget) =>
        budget.accountId === accountId &&
        budget.categoryId === nextId &&
        budget.month === monthStart(month),
    );
    setAmount(existing ? String(existing.amount) : "");
    setError(null);
    setCategoryOpen(false);
  }

  async function handleSave() {
    setError(null);
    if (!account) return setError("Choose an account first.");
    if (!categoryId) return setError("Choose a category.");
    const value = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a budget greater than zero.");
      return;
    }
    setSaving(true);
    try {
      const input: BudgetInput = {
        accountId,
        categoryId,
        month,
        amount: value,
        currency,
      };
      await setBudget(input);
      showToast(existingBudget ? "Budget updated" : "Budget set");
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save budget.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!existingBudget) return;
    Alert.alert(
      "Remove this budget?",
      `${selectedCategory?.name ?? "This category"} will be unplanned for ${formatMonth(month, "long")}.`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteBudget(existingBudget.id);
              showToast("Budget removed");
              router.back();
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : "Could not remove budget.",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  if (!account) {
    return (
      <FormShell title="Budget" onCancel={() => router.back()}>
        <EmptyState
          icon={<Wallet color={colors.brand} size={22} />}
          title="Account not found"
          description="Open the Budgets tab and choose an account first."
          action={<Button label="Back" onPress={() => router.back()} />}
        />
      </FormShell>
    );
  }

  if (!expenseCategories.length) {
    return (
      <FormShell title="Set a budget" onCancel={() => router.back()}>
        <EmptyState
          icon={<Wallet color={colors.brand} size={22} />}
          title="No expense categories"
          description="Add an expense category in Settings before building a budget."
          action={<Button label="Open settings" onPress={() => router.push("/settings")} />}
        />
      </FormShell>
    );
  }

  return (
    <FormShell
      title={existingBudget ? "Edit budget" : "Set a budget"}
      subtitle={`${account.name} · ${formatMonth(month, "long")}`}
      onCancel={() => router.back()}
      onSave={handleSave}
      saveLabel={existingBudget ? "Save" : "Set"}
      saving={saving}
      error={error}
      footer={
        existingBudget ? (
          <Button label="Remove budget" variant="danger" onPress={confirmDelete} />
        ) : null
      }
    >
      <SelectRow
        label="Account"
        value={`${account.name} · ${account.currency}`}
        placeholder="Choose account"
        onPress={() => undefined}
        disabled
        icon={<AppIcon name={account.icon} color={account.color} size={15} />}
      />

      <SelectRow
        label="Category"
        value={selectedCategory?.name}
        placeholder="Choose category"
        onPress={() => setCategoryOpen(true)}
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

      <Field label={`Monthly budget (${currency})`}>
        <View style={styles.amountRow}>
          <View style={styles.currencyTag}>
            <Text style={styles.currencyCode}>{currency}</Text>
          </View>
          <Input
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
            style={styles.amountInput}
          />
        </View>
      </Field>

      {existingBudget ? (
        <View style={styles.info}>
          <Check color={colors.success} size={16} />
          <Text style={styles.infoText}>
            {formatMoney(existingBudget.amount, currency)} is already planned for
            this category.
          </Text>
        </View>
      ) : null}

      {suggestion ? (
        <Pressable
          onPress={() => setAmount(String(suggestion))}
          style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.8 }]}
        >
          <Sparkles color={colors.brand} size={16} />
          <View style={{ flex: 1 }}>
            <Text style={styles.suggestionTitle}>
              Suggested {formatMoney(suggestion, currency)}
            </Text>
            <Text style={styles.suggestionText}>
              A practical starting point for {selectedCategory?.name} in {currency}.
            </Text>
          </View>
          <Text style={styles.use}>Use</Text>
        </Pressable>
      ) : null}

      <Text style={styles.note}>
        Budgets are per account and reset each month. Spending from another
        account never counts against this plan.
      </Text>

      <Sheet
        visible={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        title="Choose category"
      >
        <View style={styles.categoryList}>
          {expenseCategories.map((category) => {
            const planned = budgets.find(
              (budget) =>
                budget.accountId === accountId &&
                budget.categoryId === category.id &&
                budget.month === monthStart(month),
            );
            return (
              <Pressable
                key={category.id}
                onPress={() => chooseCategory(category.id)}
                style={[
                  styles.categoryOption,
                  category.id === categoryId && styles.categoryOptionActive,
                ]}
              >
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${category.color}16` },
                  ]}
                >
                  <AppIcon name={category.icon} color={category.color} size={16} />
                </View>
                <Text style={styles.categoryName}>{category.name}</Text>
                {planned ? (
                  <Text style={styles.planned}>
                    {formatMoney(planned.amount, currency)}
                  </Text>
                ) : null}
                {category.id === categoryId ? (
                  <Check color={colors.brand} size={16} />
                ) : null}
              </Pressable>
            );
          })}
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
    fontSize: 24,
    letterSpacing: -0.8,
  },
  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
    padding: 11,
  },
  infoText: {
    flex: 1,
    fontFamily: font.medium,
    fontSize: 10,
    lineHeight: 15,
    color: colors.successDark,
  },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
    padding: 12,
  },
  suggestionTitle: { fontFamily: font.semibold, fontSize: 11, color: colors.brand },
  suggestionText: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 9,
    lineHeight: 14,
    color: colors.muted,
  },
  use: { fontFamily: font.semibold, fontSize: 10, color: colors.brand },
  note: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.subtle,
    textAlign: "center",
  },
  categoryList: { gap: 7, paddingBottom: 8 },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 11,
  },
  categoryOptionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  categoryIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: { flex: 1, fontFamily: font.medium, fontSize: 12, color: colors.ink },
  planned: { fontFamily: font.regular, fontSize: 9, color: colors.subtle },
});
