import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronDown,
  Plus,
  ReceiptText,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react-native";
import {
  accountBalanceAt,
  accountBalanceCaption,
  accountDisplayBalance,
  accountOpeningBalanceAt,
  currentMonthKey,
  formatMonth,
  summarizeTransactions,
  transactionsForAccountMonth,
  type TransactionType,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { AccountSwitcher } from "@/components/account-switcher";
import { MonthPicker } from "@/components/month-picker";
import { TransactionRow } from "@/components/transaction-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

type TypeFilter = "all" | TransactionType;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expense", label: "Expenses" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfers" },
];

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categories, transactions, deleteTransaction, refresh } = useData();
  const { activeAccounts, selectedAccount } = useAccountSelection();
  const { showToast } = useToast();
  const [month, setMonth] = useState(currentMonthKey());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryId, setCategoryId] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const monthTransactions = useMemo(
    () =>
      selectedAccount
        ? transactionsForAccountMonth(transactions, selectedAccount.id, month)
        : [],
    [transactions, selectedAccount, month],
  );
  const summary = useMemo(() => summarizeTransactions(monthTransactions), [monthTransactions]);
  const opening = selectedAccount
    ? accountOpeningBalanceAt(selectedAccount, transactions, month)
    : 0;
  const closing = selectedAccount
    ? accountBalanceAt(selectedAccount, transactions, month)
    : 0;
  const categoryName = categories.find((category) => category.id === categoryId)?.name;

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return monthTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
      if (categoryId && transaction.categoryId !== categoryId) return false;
      if (!search) return true;
      const category = categories.find((item) => item.id === transaction.categoryId);
      return (
        transaction.merchant.toLowerCase().includes(search) ||
        (transaction.notes ?? "").toLowerCase().includes(search) ||
        (category?.name ?? "").toLowerCase().includes(search)
      );
    });
  }, [monthTransactions, typeFilter, categoryId, query, categories]);

  function openActions(id: string, title: string) {
    Alert.alert(title, "What would you like to do?", [
      { text: "Edit", onPress: () => router.push(`/transaction/${id}`) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
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
          ),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function handleRefresh() {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  const header = (
    <View style={styles.header}>
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        description="Every entry that touches this account, including both sides of a transfer."
        actions={
          <Button
            label="Add"
            size="sm"
            icon={<Plus color={colors.white} size={15} />}
            onPress={() => router.push("/transaction/new")}
          />
        }
      />
      <View style={styles.toolbar}>
        <MonthPicker month={month} onChange={setMonth} />
      </View>
      <AccountSwitcher fullWidth />

      {selectedAccount ? (
        <>
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Opening"
              value={opening}
              currency={selectedAccount.currency}
              caption="Carried from last month"
            />
            <SummaryCard
              label="Closing"
              value={accountDisplayBalance(selectedAccount, closing)}
              currency={selectedAccount.currency}
              caption={accountBalanceCaption(selectedAccount, closing)}
            />
            <SummaryCard
              label="Spent"
              value={summary.expenses}
              currency={selectedAccount.currency}
              caption={`${summary.count} entries`}
            />
            <SummaryCard
              label="Income"
              value={summary.income}
              currency={selectedAccount.currency}
              caption={`Net ${summary.net >= 0 ? "+" : "−"}${formatNumber(Math.abs(summary.net))}`}
            />
          </View>

          <View style={styles.searchRow}>
            <Search color={colors.subtle} size={16} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search merchant, notes or category"
              placeholderTextColor={colors.subtle}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear search">
                <X color={colors.subtle} size={16} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {TYPE_FILTERS.map((filter) => {
              const active = typeFilter === filter.value;
              return (
                <Pressable
                  key={filter.value}
                  onPress={() => setTypeFilter(filter.value)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {filter.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setCategoryOpen(true)}
              style={[styles.chip, styles.categoryChip, categoryId && styles.chipActive]}
            >
              <SlidersHorizontal
                color={categoryId ? colors.brand : colors.muted}
                size={12}
              />
              <Text style={[styles.chipText, categoryId && styles.chipTextActive]}>
                {categoryName ?? "All categories"}
              </Text>
              <ChevronDown color={categoryId ? colors.brand : colors.subtle} size={12} />
            </Pressable>
          </ScrollView>

          <View style={styles.listHeading}>
            <Text style={styles.listTitle}>
              {formatMonth(month, "long")}
            </Text>
            <Badge tone="neutral">
              {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
            </Badge>
          </View>
        </>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <FlatList
        data={selectedAccount ? filtered : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.rowWrap}>
            <TransactionRow
              transaction={item}
              account={selectedAccount ?? undefined}
              category={categories.find((category) => category.id === item.categoryId)}
              transferAccount={activeAccounts.find(
                (account) => account.id === item.transferAccountId,
              )}
              perspectiveAccountId={selectedAccount?.id}
              onPress={() => router.push(`/transaction/${item.id}`)}
              onActions={() => openActions(item.id, item.merchant || "Transaction")}
            />
          </View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <EmptyState
              icon={<ReceiptText color={colors.brand} size={22} />}
              title={selectedAccount ? "No matching entries" : "Add an account first"}
              description={
                selectedAccount
                  ? "Try another month, clear the filters or add a new transaction."
                  : "Transactions live inside an account. Add one to begin."
              }
              action={
                selectedAccount ? (
                  <Button
                    label="Add transaction"
                    icon={<Plus color={colors.white} size={15} />}
                    onPress={() => router.push("/transaction/new")}
                  />
                ) : (
                  <Button label="Add account" onPress={() => router.push("/account/new")} />
                )
              }
            />
          </View>
        }
        ListFooterComponent={<View style={{ height: insets.bottom + 24 }} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
          />
        }
      />

      <Sheet
        visible={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        title="Filter by category"
      >
        <View style={styles.categoryList}>
          <Pressable
            onPress={() => {
              setCategoryId("");
              setCategoryOpen(false);
            }}
            style={[styles.categoryOption, !categoryId && styles.categoryOptionActive]}
          >
            <Text style={[styles.categoryOptionText, !categoryId && styles.categoryOptionTextActive]}>
              All categories
            </Text>
          </Pressable>
          {categories.map((category) => {
            const active = categoryId === category.id;
            return (
              <Pressable
                key={category.id}
                onPress={() => {
                  setCategoryId(category.id);
                  setCategoryOpen(false);
                }}
                style={[styles.categoryOption, active && styles.categoryOptionActive]}
              >
                <View style={[styles.categoryDot, { backgroundColor: category.color }]} />
                <Text
                  style={[
                    styles.categoryOptionText,
                    active && styles.categoryOptionTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  caption,
}: {
  label: string;
  value: number;
  currency: string;
  caption: string;
}) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Money value={value} currency={currency} size={16} />
      <Text style={styles.summaryCaption} numberOfLines={1}>
        {caption}
      </Text>
    </View>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-AE", { maximumFractionDigits: 0 }).format(value);
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 18, paddingBottom: 0 },
  header: { gap: 16, paddingBottom: 8 },
  toolbar: { flexDirection: "row", alignItems: "center", gap: 8 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryCard: {
    width: "48.7%",
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    padding: 12,
  },
  summaryLabel: {
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.subtle,
  },
  summaryCaption: { fontFamily: font.regular, fontSize: 9, color: colors.subtle },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontFamily: font.medium, fontSize: 12, color: colors.ink },
  filters: { gap: 7, paddingRight: 18 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
  },
  categoryChip: { paddingRight: 9 },
  chipActive: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  chipText: { fontFamily: font.medium, fontSize: 10, color: colors.muted },
  chipTextActive: { color: colors.brand, fontFamily: font.semibold },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 4,
  },
  listTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  rowWrap: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  emptyWrap: { paddingTop: 14 },
  categoryList: { gap: 7, paddingBottom: 8 },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 13,
  },
  categoryOptionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  categoryOptionText: { fontFamily: font.medium, fontSize: 13, color: colors.ink },
  categoryOptionTextActive: { color: colors.brand, fontFamily: font.semibold },
  categoryDot: { width: 9, height: 9, borderRadius: 5 },
});
