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
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Plus,
  ReceiptText,
  TrendingUp,
} from "lucide-react-native";
import {
  accountBalanceAt,
  accountBalanceCaption,
  accountDisplayBalance,
  accountOpeningBalanceAt,
  budgetRows,
  currencySymbol,
  currentMonthKey,
  formatCompactNumber,
  formatMonth,
  initials,
  monthlyTrend,
  overspentCategories,
  projectedSpend,
  spendingByCategory,
  summarizeTransactions,
  transactionsForAccount,
  transactionsForAccountMonth,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useAuth } from "@/contexts/auth";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { AccountCard } from "@/components/account-card";
import { AccountSwitcher } from "@/components/account-switcher";
import { DonutChart } from "@/components/charts/donut-chart";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { MonthPicker } from "@/components/month-picker";
import { TransactionRow } from "@/components/transaction-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Logo } from "@/components/ui/logo";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress";
import { colors, font, radius } from "@/lib/theme";

export default function OverviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, categories, transactions, budgets, ready, error, refresh, deleteTransaction } =
    useData();
  const { activeAccounts, selectedAccount, setSelectedAccountId } = useAccountSelection();
  const { showToast } = useToast();
  const [month, setMonth] = useState(currentMonthKey());
  const [refreshing, setRefreshing] = useState(false);

  const accountTransactions = useMemo(
    () => (selectedAccount ? transactionsForAccount(transactions, selectedAccount.id) : []),
    [transactions, selectedAccount],
  );
  const monthTransactions = useMemo(
    () =>
      selectedAccount
        ? transactionsForAccountMonth(transactions, selectedAccount.id, month)
        : [],
    [transactions, selectedAccount, month],
  );
  const summary = useMemo(() => summarizeTransactions(monthTransactions), [monthTransactions]);
  const closing = selectedAccount
    ? accountBalanceAt(selectedAccount, transactions, month)
    : 0;
  const opening = selectedAccount
    ? accountOpeningBalanceAt(selectedAccount, transactions, month)
    : 0;
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
  const budgetedRows = rows.filter((row) => row.budget);
  const totalBudget = budgetedRows.reduce((total, row) => total + (row.budget?.amount ?? 0), 0);
  const totalBudgetSpent = budgetedRows.reduce((total, row) => total + row.spent, 0);
  const overBudget = overspentCategories(rows);
  const trend = useMemo(
    () => monthlyTrend(accountTransactions, month, 6),
    [accountTransactions, month],
  );
  const segments = useMemo(() => {
    if (!selectedAccount) return [];
    const totals = spendingByCategory(monthTransactions);
    const byCategory = new Map(categories.map((category) => [category.id, category]));
    const known = Array.from(totals.entries())
      .map(([id, value]) => ({
        label: byCategory.get(id)?.name ?? "Uncategorized",
        value,
        color: byCategory.get(id)?.color ?? colors.subtle,
      }))
      .sort((a, b) => b.value - a.value);
    if (known.length <= 5) return known;
    const top = known.slice(0, 5);
    const other = known.slice(5).reduce((total, item) => total + item.value, 0);
    return [...top, { label: "Other", value: other, color: colors.subtle }];
  }, [categories, monthTransactions, selectedAccount]);
  const projected = selectedAccount
    ? projectedSpend(accountTransactions, month)
    : null;

  async function handleRefresh() {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  function openTransactionActions(id: string, title: string) {
    Alert.alert(title, "What would you like to do?", [
      { text: "Edit", onPress: () => router.push(`/transaction/${id}`) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Alert.alert(
            "Delete transaction?",
            "This entry will be removed from your ledger. It cannot be undone.",
            [
              { text: "Keep it", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    await deleteTransaction(id);
                    showToast("Transaction deleted");
                  } catch (caught) {
                    showToast(
                      caught instanceof Error ? caught.message : "Could not delete transaction.",
                      "error",
                    );
                  }
                },
              },
            ],
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
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
        <View style={styles.topBar}>
          <Logo />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {initials(profile.fullName || user?.name || "You") || "A"}
            </Text>
          </Pressable>
        </View>

        <PageHeader
          eyebrow="Overview"
          title={`Hello, ${(profile.fullName || user?.name || "there").split(" ")[0]}`}
          description="A calm view of the account you selected, one month at a time."
        />

        <View style={styles.toolbar}>
          <MonthPicker month={month} onChange={setMonth} />
        </View>
        <AccountSwitcher fullWidth />

        {error ? (
          <View style={styles.errorBanner}>
            <AlertTriangle color={colors.danger} size={17} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!selectedAccount ? (
          <EmptyState
            icon={<ReceiptText color={colors.brand} size={22} />}
            title="Add your first account"
            description="Start with a bank account, a cash source or a credit card."
            action={
              <Button
                label="Add account"
                icon={<Plus color={colors.white} size={16} />}
                onPress={() => router.push("/account/new")}
              />
            }
          />
        ) : (
          <>
            <View style={[styles.hero, { backgroundColor: selectedAccount.color }]}>
              <View style={styles.heroRingLarge} />
              <View style={styles.heroRingSmall} />
              <View style={styles.heroTop}>
                <View style={styles.heroIdentity}>
                  <View style={styles.heroIcon}>
                    <Text style={styles.heroIconText}>
                      {selectedAccount.name.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text style={styles.heroName}>{selectedAccount.name}</Text>
                    <Text style={styles.heroMeta}>
                      {formatMonth(month, "long")} · {selectedAccount.currency}
                    </Text>
                  </View>
                </View>
                <Badge tone="brand">
                  {selectedAccount.type === "credit_card"
                    ? "Credit card"
                    : selectedAccount.type === "cash"
                      ? "Cash"
                      : "Bank"}
                </Badge>
              </View>

              <View style={styles.heroBalance}>
                <Text style={styles.heroLabel}>
                  {accountBalanceCaption(selectedAccount, closing)}
                </Text>
                <Money
                  value={accountDisplayBalance(selectedAccount, closing)}
                  currency={selectedAccount.currency}
                  size={32}
                  color={colors.white}
                  weight="semibold"
                  display="symbol"
                  compact
                  compactFrom={1_000_000_000}
                />
                <Text style={styles.heroOpening}>
                  Opened at {formatCompact(opening, selectedAccount.currency)}
                </Text>
              </View>

              <View style={styles.heroFooter}>
                <View style={styles.heroFooterRow}>
                  <Text style={styles.heroFooterLabel}>Spent</Text>
                  <Money
                    value={summary.expenses}
                    currency={selectedAccount.currency}
                    size={13}
                    color={colors.white}
                    display="symbol"
                  />
                </View>
                <View style={styles.heroFooterRow}>
                  <Text style={styles.heroFooterLabel}>Income</Text>
                  <Money
                    value={summary.income}
                    currency={selectedAccount.currency}
                    size={13}
                    color={colors.white}
                    display="symbol"
                  />
                </View>
                <View style={styles.heroFooterRow}>
                  <Text style={styles.heroFooterLabel}>Net</Text>
                  <Money
                    value={summary.net}
                    currency={selectedAccount.currency}
                    size={13}
                    color={colors.white}
                    display="symbol"
                    showSign
                  />
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard
                label="Spent"
                value={summary.expenses}
                currency={selectedAccount.currency}
                icon={<ArrowUpRight color={colors.brand} size={15} />}
              />
              <StatCard
                label="Income"
                value={summary.income}
                currency={selectedAccount.currency}
                icon={<ArrowDownLeft color={colors.success} size={15} />}
              />
              <StatCard
                label="Transactions"
                value={summary.count}
                currency=""
                icon={<ReceiptText color={colors.warning} size={15} />}
              />
            </View>

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Budget health</Text>
                  <Text style={styles.sectionDescription}>
                    {overBudget.length
                      ? `${overBudget.length} categor${overBudget.length === 1 ? "y" : "ies"} over plan`
                      : "Everything is inside the plan."}
                  </Text>
                </View>
                <Pressable onPress={() => router.push("/budgets")} style={styles.link}>
                  <Text style={styles.linkText}>View</Text>
                  <ChevronRight color={colors.brand} size={14} />
                </Pressable>
              </View>
              {totalBudget > 0 ? (
                <View style={styles.budgetHealth}>
                  <View style={styles.budgetNumbers}>
                    <Money
                      value={totalBudgetSpent}
                      currency={selectedAccount.currency}
                      size={22}
                      display="symbol"
                      compact
                    />
                    <Text style={styles.budgetOf}>
                      of {formatMoneyShort(totalBudget, selectedAccount.currency)}
                    </Text>
                  </View>
                  <ProgressBar
                    value={(totalBudgetSpent / totalBudget) * 100}
                    color={overBudget.length ? colors.danger : colors.brand}
                    height={8}
                  />
                  <View style={styles.budgetFooter}>
                    <Text style={styles.mutedSmall}>
                      {Math.round((totalBudgetSpent / totalBudget) * 100)}% used
                    </Text>
                    <Text style={[styles.mutedSmall, overBudget.length > 0 && { color: colors.danger }]}>
                      {overBudget.length
                        ? `${Math.round(overBudget[0].progress)}% top overrun`
                        : `${formatNumberShort(Math.max(0, totalBudget - totalBudgetSpent))} left`}
                    </Text>
                  </View>
                </View>
              ) : (
                <Pressable onPress={() => router.push("/budgets")} style={styles.budgetCta}>
                  <Text style={styles.budgetCtaTitle}>Build this month’s plan</Text>
                  <Text style={styles.budgetCtaText}>
                    Add category budgets and watch them reset next month.
                  </Text>
                  <ChevronRight color={colors.brand} size={16} />
                </Pressable>
              )}
              {projected !== null && projected > 0 ? (
                <View style={styles.projection}>
                  <TrendingUp color={colors.warning} size={14} />
                  <Text style={styles.projectionText}>
                    Projected month-end spend {formatMoneyShort(projected, selectedAccount.currency)}
                  </Text>
                </View>
              ) : null}
            </Card>

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Cash flow</Text>
                  <Text style={styles.sectionDescription}>Last six months</Text>
                </View>
              </View>
              <MonthlyBars data={trend} selectedMonth={month} currency={selectedAccount.currency} />
            </Card>

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Where it went</Text>
                  <Text style={styles.sectionDescription}>
                    {formatMonth(month, "long")} spending by category
                  </Text>
                </View>
              </View>
              <DonutChart
                segments={segments}
                total={summary.expenses}
                currency={selectedAccount.currency}
              />
            </Card>

            <Card style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Recent activity</Text>
                  <Text style={styles.sectionDescription}>
                    {summary.count
                      ? `${summary.count} ${summary.count === 1 ? "entry" : "entries"} this month`
                      : "Nothing recorded yet"}
                  </Text>
                </View>
                <Pressable onPress={() => router.push("/transactions")} style={styles.link}>
                  <Text style={styles.linkText}>All</Text>
                  <ChevronRight color={colors.brand} size={14} />
                </Pressable>
              </View>
              {monthTransactions.length ? (
                monthTransactions.slice(0, 5).map((transaction, index) => (
                  <View
                    key={transaction.id}
                    style={index > 0 ? styles.rowDivider : undefined}
                  >
                    <TransactionRow
                      transaction={transaction}
                      account={selectedAccount}
                      category={categories.find((category) => category.id === transaction.categoryId)}
                      transferAccount={activeAccounts.find(
                        (account) => account.id === transaction.transferAccountId,
                      )}
                      perspectiveAccountId={selectedAccount.id}
                      onPress={() => router.push(`/transaction/${transaction.id}`)}
                      onActions={() =>
                        openTransactionActions(transaction.id, transaction.merchant || "Transaction")
                      }
                    />
                  </View>
                ))
              ) : (
                <View style={styles.emptyInline}>
                  <Text style={styles.emptyInlineTitle}>No activity this month</Text>
                  <Text style={styles.emptyInlineText}>
                    Tap the purple + to add your first transaction.
                  </Text>
                </View>
              )}
            </Card>

            <View style={styles.accountsSection}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Your accounts</Text>
                  <Text style={styles.sectionDescription}>
                    Tap a card to switch the whole workspace.
                  </Text>
                </View>
                <Pressable onPress={() => router.push("/accounts")} style={styles.link}>
                  <Text style={styles.linkText}>Manage</Text>
                  <ChevronRight color={colors.brand} size={14} />
                </Pressable>
              </View>
              <View style={styles.accountGrid}>
                {activeAccounts.map((account) => (
                  <View key={account.id} style={styles.accountCell}>
                    <AccountCard
                      account={account}
                      selected={account.id === selectedAccount.id}
                      onPress={() => setSelectedAccountId(account.id)}
                    />
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {!ready && !selectedAccount ? (
          <View style={styles.loadingNote}>
            <Text style={styles.mutedSmall}>Loading your workspace…</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  label,
  value,
  currency,
  icon,
}: {
  label: string;
  value: number;
  currency: string;
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      {currency ? (
        <Money value={value} currency={currency} size={13} display="symbol" compact />
      ) : (
        <Text style={styles.statValue}>{Math.round(value)}</Text>
      )}
    </View>
  );
}

function formatMoneyShort(value: number, currency: string) {
  const formatted =
    Math.abs(value) >= 1_000_000
      ? formatCompactNumber(value, currency)
      : new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-AE", {
          maximumFractionDigits: 0,
        }).format(Math.abs(value));
  return `${currencySymbol(currency)} ${formatted}`;
}

function formatNumberShort(value: number) {
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(value);
}

function formatCompact(value: number, currency: string) {
  return `${currencySymbol(currency)} ${new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-AE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.abs(value))}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: 18, gap: 16 },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: font.semibold, fontSize: 13, color: colors.brand },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 8 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    borderRadius: radius.lg,
    backgroundColor: colors.dangerSoft,
    padding: 12,
  },
  errorText: { flex: 1, fontFamily: font.medium, fontSize: 11, lineHeight: 16, color: colors.danger },
  hero: {
    borderRadius: 24,
    padding: 18,
    minHeight: 228,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  heroRingLarge: {
    position: "absolute",
    right: -56,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  heroRingSmall: {
    position: "absolute",
    right: 4,
    top: 30,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  heroTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  heroIdentity: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroIconText: { fontFamily: font.semibold, fontSize: 17, color: colors.white },
  heroName: { fontFamily: font.semibold, fontSize: 14, color: colors.white },
  heroMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: "rgba(255,255,255,0.68)" },
  heroBalance: { gap: 3, paddingVertical: 16 },
  heroLabel: {
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.68)",
  },
  heroOpening: { fontFamily: font.regular, fontSize: 10, color: "rgba(255,255,255,0.55)" },
  heroFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
    paddingTop: 12,
    gap: 7,
  },
  heroFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  heroFooterLabel: {
    fontFamily: font.medium,
    fontSize: 8,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.58)",
  },
  statsRow: { flexDirection: "row", gap: 9 },
  statCard: {
    flex: 1,
    gap: 5,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { fontFamily: font.medium, fontSize: 9, color: colors.subtle },
  statValue: { fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  section: { gap: 14, padding: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10 },
  sectionTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink, letterSpacing: -0.2 },
  sectionDescription: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  link: { flexDirection: "row", alignItems: "center", gap: 2, paddingTop: 2 },
  linkText: { fontFamily: font.semibold, fontSize: 10, color: colors.brand },
  budgetHealth: { gap: 8 },
  budgetNumbers: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  budgetOf: { fontFamily: font.regular, fontSize: 11, color: colors.subtle },
  budgetFooter: { flexDirection: "row", justifyContent: "space-between" },
  mutedSmall: { fontFamily: font.regular, fontSize: 10, color: colors.muted },
  budgetCta: {
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    padding: 14,
    gap: 3,
  },
  budgetCtaTitle: { fontFamily: font.semibold, fontSize: 13, color: colors.brand },
  budgetCtaText: { fontFamily: font.regular, fontSize: 10, lineHeight: 15, color: colors.muted, paddingRight: 20 },
  projection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  projectionText: { flex: 1, fontFamily: font.medium, fontSize: 9, color: colors.warning },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  emptyInline: { paddingVertical: 20, alignItems: "center" },
  emptyInlineTitle: { fontFamily: font.semibold, fontSize: 12, color: colors.ink },
  emptyInlineText: { marginTop: 3, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  accountsSection: { gap: 12 },
  accountGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  accountCell: { width: "48.6%" },
  loadingNote: { alignItems: "center", paddingVertical: 12 },
});
