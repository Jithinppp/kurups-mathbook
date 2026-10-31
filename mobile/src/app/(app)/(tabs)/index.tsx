import { memo, useCallback, useMemo, useState } from "react";
import {
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
  CreditCard,
  Plus,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react-native";
import {
  ACCOUNT_TYPE_LABEL,
  accountBalanceAt,
  accountBalanceCaption,
  accountDisplayBalance,
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
  type AccountWithBalance,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useAuth } from "@/contexts/auth";
import { useData } from "@/contexts/data";
import { AppIcon } from "@/components/ui/app-icon";
import { DonutChart } from "@/components/charts/donut-chart";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { MonthPicker } from "@/components/month-picker";
import { TransactionRow } from "@/components/transaction-row";
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
  const { profile, categories, transactions, budgets, ready, error, refresh } = useData();
  const { activeAccounts, selectedAccount, setSelectedAccountId } = useAccountSelection();
  const [month, setMonth] = useState(currentMonthKey());
  const [refreshing, setRefreshing] = useState(false);
  const selectAccount = useCallback(
    (id: string) => {
      setSelectedAccountId(id);
    },
    [setSelectedAccountId],
  );
  const addTransactionFor = useCallback(
    (id: string) => {
      router.push(`/transaction/new?accountId=${encodeURIComponent(id)}`);
    },
    [router],
  );

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
  const rows = useMemo(
    () =>
      selectedAccount
        ? budgetRows(
            categories,
            monthTransactions,
            budgets,
            month,
            selectedAccount.id,
            selectedAccount.currency,
          )
        : [],
    [categories, monthTransactions, budgets, month, selectedAccount],
  );
  const budgetedRows = rows.filter((row) => row.budget);
  const totalBudget = budgetedRows.reduce((total, row) => total + (row.budget?.amount ?? 0), 0);
  const totalBudgetSpent = budgetedRows.reduce((total, row) => total + row.spent, 0);
  const budgetLeft = totalBudget - totalBudgetSpent;
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
  const monthBalanceByAccount = useMemo(
    () =>
      new Map(
        activeAccounts.map((account) => [
          account.id,
          accountBalanceAt(account, transactions, month),
        ]),
      ),
    [activeAccounts, transactions, month],
  );
  const closingDisplay = selectedAccount
    ? accountDisplayBalance(selectedAccount, closing)
    : 0;
  const balanceLabel = selectedAccount
    ? selectedAccount.type === "credit_card"
      ? closing > 0
        ? "Credit balance"
        : "Card owed"
      : closing < 0
        ? "Overdrawn"
        : "Closing balance"
    : "Balance";
  const heroOverlay = selectedAccount
    ? Math.min(0.55, Math.max(0.14, relativeLuminance(selectedAccount.color) * 0.75))
    : 0;

  async function handleRefresh() {
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
          description="Every account in one place. Pick one to focus the page, or add an entry to any account."
        />

        <View style={styles.toolbar}>
          <MonthPicker month={month} onChange={setMonth} />
        </View>

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
              <View
                style={[
                  styles.heroOverlay,
                  { backgroundColor: `rgba(16, 17, 20, ${heroOverlay})` },
                ]}
              />
              <View style={styles.heroRingLarge} />
              <View style={styles.heroRingSmall} />

              <View style={styles.heroContent}>
                <View style={styles.heroTop}>
                  <View style={styles.heroIntro}>
                    <Text style={styles.heroEyebrow}>All accounts</Text>
                    <Text style={styles.heroDescription}>
                      Balances at the end of {formatMonth(month, "long")}. Pick an
                      account to focus the page, or add an entry to any account.
                    </Text>
                  </View>
                  <View style={styles.heroCount}>
                    <Text style={styles.heroCountText}>
                      {activeAccounts.length} active
                    </Text>
                  </View>
                </View>

                <View style={styles.accountList}>
                  {activeAccounts.map((account) => (
                    <MemoizedOverviewAccountRow
                      key={account.id}
                      account={account}
                      balance={monthBalanceByAccount.get(account.id) ?? account.balance}
                      selected={account.id === selectedAccount.id}
                      onSelect={selectAccount}
                      onAddTransaction={addTransactionFor}
                    />
                  ))}
                </View>

                <View style={styles.heroLinks}>
                  <Pressable
                    onPress={() => router.push("/transactions")}
                    style={styles.heroLink}
                  >
                    <Text style={styles.heroLinkText}>View transactions</Text>
                    <ChevronRight color="rgba(255,255,255,0.65)" size={13} />
                  </Pressable>
                  <Pressable
                    onPress={() => router.push("/accounts")}
                    style={styles.heroLink}
                  >
                    <Text style={styles.heroLinkText}>Manage accounts</Text>
                    <ChevronRight color="rgba(255,255,255,0.65)" size={13} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatCard
                label="Spent this month"
                value={summary.expenses}
                currency={selectedAccount.currency}
                hint={`${summary.count} ${
                  summary.count === 1 ? "entry" : "entries"
                } for ${selectedAccount.name}`}
                icon={<ArrowUpRight color={colors.brand} size={14} />}
              />
              <StatCard
                label="Money in"
                value={summary.income}
                currency={selectedAccount.currency}
                hint="Income recorded this month"
                icon={<ArrowDownLeft color={colors.success} size={14} />}
              />
              <StatCard
                label={budgetLeft < 0 ? "Over budget" : "Budget left"}
                value={Math.abs(budgetLeft)}
                currency={selectedAccount.currency}
                hint={
                  totalBudget > 0
                    ? `${Math.round((totalBudgetSpent / totalBudget) * 100)}% of plan used`
                    : "No budgets set for this month"
                }
                tone={budgetLeft < 0 ? "danger" : "neutral"}
                icon={<Wallet color={colors.warning} size={14} />}
              />
              <StatCard
                label={balanceLabel}
                value={closingDisplay}
                currency={selectedAccount.currency}
                hint={`${formatMonth(month, "long")} close`}
                tone={closing < 0 ? "danger" : "neutral"}
                icon={
                  selectedAccount.type === "credit_card" ? (
                    <CreditCard color={colors.muted} size={14} />
                  ) : (
                    <Wallet color={colors.muted} size={14} />
                  )
                }
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
  hint,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: number;
  currency: string;
  hint: string;
  tone?: "neutral" | "danger";
  icon: React.ReactNode;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statTop}>
        <View style={styles.statIcon}>{icon}</View>
        <Text style={styles.statLabel} numberOfLines={2}>
          {label}
        </Text>
      </View>
      <Money
        value={value}
        currency={currency}
        size={16}
        color={tone === "danger" ? colors.danger : colors.ink}
        display="symbol"
        compact
      />
      <Text style={styles.statHint} numberOfLines={2}>
        {hint}
      </Text>
    </View>
  );
}

function OverviewAccountRow({
  account,
  balance,
  selected,
  onSelect,
  onAddTransaction,
}: {
  account: AccountWithBalance;
  balance: number;
  selected: boolean;
  onSelect: (accountId: string) => void;
  onAddTransaction: (accountId: string) => void;
}) {
  const display = accountDisplayBalance(account, balance);
  const caption = accountBalanceCaption(account, balance);
  const kind = ACCOUNT_TYPE_LABEL[account.type] ?? "Account";

  return (
    <View style={[styles.accountRow, selected && styles.accountRowSelected]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select ${account.name}`}
        accessibilityState={{ selected }}
        onPress={() => onSelect(account.id)}
        style={styles.accountTop}
      >
        <View style={styles.accountIcon}>
          <AppIcon name={account.icon} color={colors.white} size={16} />
        </View>
        <View style={styles.accountCopy}>
          <View style={styles.accountNameRow}>
            <Text style={styles.accountName} numberOfLines={1}>
              {account.name}
            </Text>
            {selected ? (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>Selected</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.accountMeta} numberOfLines={1}>
            {kind} · {account.currency}
            {account.institution ? ` · ${account.institution}` : ""}
            {account.lastFour ? ` · •••• ${account.lastFour}` : ""}
          </Text>
        </View>
      </Pressable>

      <View style={styles.accountBottom}>
        <View style={styles.accountBalance}>
          <Text style={styles.accountCaption}>{caption}</Text>
          <Money
            value={display}
            currency={account.currency}
            size={15}
            color={colors.white}
            display="symbol"
            compact
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add transaction for ${account.name}`}
          onPress={() => onAddTransaction(account.id)}
          style={({ pressed }) => [styles.addTransaction, pressed && { opacity: 0.8 }]}
        >
          <Plus color={colors.white} size={12} />
          <Text style={styles.addTransactionText} numberOfLines={1}>
            Add transaction
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const MemoizedOverviewAccountRow = memo(OverviewAccountRow);

const shortNumberFormatters = new Map<string, Intl.NumberFormat>();

function formatShortNumber(value: number, locale: string) {
  let formatter = shortNumberFormatters.get(locale);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
    shortNumberFormatters.set(locale, formatter);
  }
  return formatter.format(Math.abs(value));
}

function relativeLuminance(hex: string) {
  const value = hex.replace("#", "");
  if (value.length !== 6) return 0;

  const [r, g, b] = [0, 2, 4].map((index) => {
    const channel = Number.parseInt(value.slice(index, index + 2), 16) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function formatMoneyShort(value: number, currency: string) {
  const formatted =
    Math.abs(value) >= 1_000_000
      ? formatCompactNumber(value, currency)
      : formatShortNumber(Math.abs(value), currency === "INR" ? "en-IN" : "en-AE");
  return `${currencySymbol(currency)} ${formatted}`;
}

function formatNumberShort(value: number) {
  return formatShortNumber(value, "en-AE");
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
    overflow: "hidden",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
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
  heroContent: { gap: 14 },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  heroIntro: { flex: 1, minWidth: 0, gap: 3 },
  heroEyebrow: {
    fontFamily: font.semibold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.65)",
  },
  heroDescription: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: "rgba(255,255,255,0.5)",
  },
  heroCount: {
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  heroCountText: { fontFamily: font.semibold, fontSize: 8, color: colors.white },
  accountList: { gap: 8 },
  accountRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 10,
    gap: 8,
  },
  accountRowSelected: {
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  accountTop: { flexDirection: "row", alignItems: "center", gap: 9 },
  accountIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountCopy: { flex: 1, minWidth: 0 },
  accountNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  accountName: { flexShrink: 1, fontFamily: font.semibold, fontSize: 12, color: colors.white },
  selectedBadge: {
    flexShrink: 0,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    fontFamily: font.semibold,
    fontSize: 7,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.8)",
  },
  accountMeta: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 9,
    color: "rgba(255,255,255,0.55)",
  },
  accountBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  accountBalance: { flex: 1, minWidth: 0, gap: 1 },
  accountCaption: {
    fontFamily: font.medium,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.45)",
  },
  addTransaction: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
  },
  addTransactionText: { fontFamily: font.semibold, fontSize: 9, color: colors.white },
  heroLinks: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  heroLink: { flexDirection: "row", alignItems: "center", gap: 2 },
  heroLinkText: { fontFamily: font.medium, fontSize: 10, color: "rgba(255,255,255,0.65)" },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  statCard: {
    width: "48%",
    minHeight: 108,
    gap: 6,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statTop: { flexDirection: "row", alignItems: "center", gap: 7 },
  statIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: { flex: 1, fontFamily: font.medium, fontSize: 9, lineHeight: 12, color: colors.subtle },
  statHint: { fontFamily: font.regular, fontSize: 9, lineHeight: 13, color: colors.subtle },
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
  loadingNote: { alignItems: "center", paddingVertical: 12 },
});
