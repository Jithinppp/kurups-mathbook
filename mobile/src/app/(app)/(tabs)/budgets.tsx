import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ChevronRight,
  PieChart,
  Plus,
  Sparkles,
} from "lucide-react-native";
import {
  budgetRows,
  currentMonthKey,
  formatMonth,
  overspentCategories,
  summarizeTransactions,
  SUGGESTED_BUDGETS,
  transactionsForAccountMonth,
  type BudgetInput,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { AccountSwitcher } from "@/components/account-switcher";
import { BudgetRow } from "@/components/budget-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress";
import { colors, font, radius } from "@/lib/theme";

export default function BudgetsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, transactions, budgets, setBudgets, refresh } = useData();
  const { selectedAccount } = useAccountSelection();
  const { showToast } = useToast();
  const [month] = useState(currentMonthKey());
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);

  const rows = useMemo(
    () =>
      selectedAccount
        ? budgetRows(
            categories,
            transactions,
            budgets,
            month,
            selectedAccount.id,
            selectedAccount.currency,
          )
        : [],
    [categories, transactions, budgets, month, selectedAccount],
  );
  const monthTransactions = useMemo(
    () =>
      selectedAccount
        ? transactionsForAccountMonth(transactions, selectedAccount.id, month)
        : [],
    [transactions, selectedAccount, month],
  );
  const summary = useMemo(() => summarizeTransactions(monthTransactions), [monthTransactions]);
  const budgetedRows = rows.filter((row) => row.budget);
  const totalBudget = budgetedRows.reduce((total, row) => total + (row.budget?.amount ?? 0), 0);
  const totalSpent = summary.expenses;
  const remaining = totalBudget - totalSpent;
  const overBudget = overspentCategories(rows);
  const suggestions = selectedAccount
    ? SUGGESTED_BUDGETS[selectedAccount.currency] ?? {}
    : {};
  const suggestionCount = Object.keys(suggestions).length;
  const unbudgetedCount = rows.filter((row) => !row.budget).length;

  async function applySuggestions() {
    if (!selectedAccount || !suggestionCount) return;
    setApplying(true);
    try {
      const inputs: BudgetInput[] = Object.entries(suggestions)
        .map(([name, amount]) => {
          const category = categories.find(
            (item) => item.name === name && item.kind === "expense",
          );
          if (!category) return null;
          return {
            accountId: selectedAccount.id,
            categoryId: category.id,
            month,
            amount,
            currency: selectedAccount.currency,
          };
        })
        .filter((input): input is BudgetInput => Boolean(input));
      await setBudgets(month, inputs);
      showToast(`Added ${inputs.length} suggested budgets`);
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not apply suggestions.",
        "error",
      );
    } finally {
      setApplying(false);
    }
  }

  function openBudget(categoryId?: string, budgetId?: string) {
    if (!selectedAccount) return;
    const params = new URLSearchParams({
      month,
      accountId: selectedAccount.id,
    });
    if (categoryId) params.set("categoryId", categoryId);
    if (budgetId) params.set("budgetId", budgetId);
    router.push(`/budget?${params.toString()}`);
  }

  function confirmSuggestions() {
    if (!selectedAccount || !suggestionCount) return;
    Alert.alert(
      "Use suggested budgets?",
      `Add ${suggestionCount} ${selectedAccount.currency} plans for ${formatMonth(month, "long")}. Existing category plans will be replaced.`,
      [
        { text: "Not now", style: "cancel" },
        { text: "Apply", onPress: () => void applySuggestions() },
      ],
    );
  }

  function handleRefresh() {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
          />
        }
      >
        <PageHeader
          eyebrow="Plan"
          title="Budgets"
          description={
            selectedAccount
              ? `Give ${selectedAccount.name} a plan for ${formatMonth(
                  month,
                  "long",
                )}. Plans reset monthly and balances carry forward.`
              : "Give every category a ceiling. Plans belong to an account and reset by month."
          }
        />

        {selectedAccount ? (
          <View style={styles.controls}>
            <Button
              label="Set budget"
              size="sm"
              icon={<Plus color={colors.white} size={15} />}
              onPress={() => openBudget()}
            />
            <AccountSwitcher fullWidth label="Change account" />
          </View>
        ) : null}

        {!selectedAccount ? (
          <EmptyState
            icon={<PieChart color={colors.brand} size={22} />}
            title="Add an account first"
            description="Budgets are scoped to one account at a time."
            action={
              <Button label="Add account" onPress={() => router.push("/account/new")} />
            }
          />
        ) : (
          <>
            <View style={styles.planCard}>
              <View style={styles.planTop}>
                <View>
                  <Text style={styles.planLabel}>Monthly plan</Text>
                  <Text style={styles.planTitle}>{formatMonth(month, "long")}</Text>
                </View>
                <View style={styles.planIcon}>
                  <PieChart color={colors.white} size={20} />
                </View>
              </View>
              <View style={styles.planNumbers}>
                <Money value={totalBudget} currency={selectedAccount.currency} size={28} color={colors.white} />
                <Text style={styles.planSub}>
                  {budgetedRows.length} planned {budgetedRows.length === 1 ? "category" : "categories"}
                </Text>
              </View>
              <ProgressBar
                value={totalBudget ? (totalSpent / totalBudget) * 100 : 0}
                color={overBudget.length ? "#ffb4a8" : colors.white}
                track="rgba(255,255,255,0.22)"
                height={7}
              />
              <View style={styles.planFooter}>
                <View>
                  <Text style={styles.planFooterLabel}>Spent</Text>
                  <Money value={totalSpent} currency={selectedAccount.currency} size={13} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.planFooterLabel}>{remaining < 0 ? "Over plan" : "Remaining"}</Text>
                  <Money
                    value={Math.abs(remaining)}
                    currency={selectedAccount.currency}
                    size={13}
                    color={colors.white}
                  />
                </View>
                <View>
                  <Text style={styles.planFooterLabel}>Unplanned</Text>
                  <Text style={styles.planFooterValue}>{unbudgetedCount}</Text>
                </View>
              </View>
            </View>

            {overBudget.length ? (
              <View style={styles.alert}>
                <AlertTriangle color={colors.danger} size={18} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.alertTitle}>
                    {overBudget.length} {overBudget.length === 1 ? "category is" : "categories are"} over plan
                  </Text>
                  <Text style={styles.alertText}>
                    {overBudget
                      .slice(0, 3)
                      .map((row) => row.category.name)
                      .join(", ")}
                    {overBudget.length > 3 ? " and more" : ""}
                  </Text>
                </View>
              </View>
            ) : null}

            {suggestionCount ? (
              <Pressable
                onPress={confirmSuggestions}
                disabled={applying}
                style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.suggestionIcon}>
                  <Sparkles color={colors.brand} size={17} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionTitle}>Use suggested {selectedAccount.currency} budgets</Text>
                  <Text style={styles.suggestionText}>
                    {suggestionCount} practical starting points for this currency.
                  </Text>
                </View>
                <ChevronRight color={colors.brand} size={17} />
              </Pressable>
            ) : null}

            <Card style={styles.listCard}>
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.listTitle}>Category plans</Text>
                  <Text style={styles.listDescription}>
                    {budgetedRows.length} of {rows.length} categories planned
                  </Text>
                </View>
                <Button
                  label="Add"
                  size="sm"
                  variant="secondary"
                  icon={<Plus color={colors.ink} size={14} />}
                  onPress={() => openBudget()}
                />
              </View>
              {rows.length ? (
                rows.map((row) => (
                  <BudgetRow
                    key={row.category.id}
                    row={row}
                    onPress={() => openBudget(row.category.id, row.budget?.id)}
                  />
                ))
              ) : (
                <EmptyState
                  icon={<PieChart color={colors.brand} size={22} />}
                  title="Add an expense category"
                  description="Categories live in Settings. Add one, then give it a monthly plan."
                  action={
                    <Button label="Open settings" onPress={() => router.push("/settings")} />
                  }
                />
              )}
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: 18, gap: 16 },
  controls: { gap: 8 },
  planCard: {
    borderRadius: 24,
    backgroundColor: colors.ink,
    padding: 18,
    gap: 14,
    overflow: "hidden",
  },
  planTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  planLabel: {
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
  },
  planTitle: { marginTop: 2, fontFamily: font.semibold, fontSize: 14, color: colors.white },
  planIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  planNumbers: { gap: 2 },
  planSub: { fontFamily: font.regular, fontSize: 10, color: "rgba(255,255,255,0.6)" },
  planFooter: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  planFooterLabel: {
    fontFamily: font.medium,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
  },
  planFooterValue: { fontFamily: font.semibold, fontSize: 13, color: colors.white },
  alert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    padding: 13,
  },
  alertTitle: { fontFamily: font.semibold, fontSize: 11, color: colors.danger },
  alertText: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: colors.danger },
  suggestion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
    padding: 13,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  suggestionTitle: { fontFamily: font.semibold, fontSize: 11, color: colors.brand },
  suggestionText: { marginTop: 2, fontFamily: font.regular, fontSize: 9, color: colors.muted },
  listCard: { gap: 12, padding: 16 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  listTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  listDescription: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
});
