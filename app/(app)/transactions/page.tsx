"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CreditCard,
  FilterX,
  Plus,
  Search,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Money } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { PageHeader } from "@/components/page-header";
import { useQuickAdd } from "@/components/quick-add";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { useAccountSelection } from "@/lib/account-selection";
import { useData } from "@/lib/data-context";
import { addMonths, currentMonthKey, formatMonth } from "@/lib/dates";
import {
  accountBalanceAt,
  accountDisplayBalance,
  accountOpeningBalanceAt,
  summarizeTransactions,
  transactionsForAccountMonth,
} from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";
import type { TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | TransactionType;

const TRANSACTIONS_PAGE_SIZE = 25;

export default function TransactionsPage() {
  const { accounts, categories, transactions, deleteTransaction, ready } =
    useData();
  const { selectedAccount } = useAccountSelection();
  const { openTransaction } = useQuickAdd();
  const [month, setMonth] = useState(currentMonthKey());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState({
    key: "",
    count: TRANSACTIONS_PAGE_SIZE,
  });

  const currency = selectedAccount?.currency ?? "AED";
  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  // A category can disappear while this page keeps its filter state. Fall back
  // to "all" instead of showing an empty ledger for a deleted category.
  const effectiveCategoryFilter =
    categoryFilter !== "all" &&
    categories.some((category) => category.id === categoryFilter)
      ? categoryFilter
      : "all";
  const monthTransactions = useMemo(
    () =>
      selectedAccount
        ? transactionsForAccountMonth(transactions, selectedAccount.id, month)
        : [],
    [transactions, selectedAccount, month],
  );
  const summary = useMemo(
    () => summarizeTransactions(monthTransactions),
    [monthTransactions],
  );
  const closingBalance = selectedAccount
    ? accountBalanceAt(selectedAccount, transactions, month)
    : 0;
  const openingBalance = selectedAccount
    ? accountOpeningBalanceAt(selectedAccount, transactions, month)
    : 0;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return monthTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
      if (
        effectiveCategoryFilter !== "all" &&
        transaction.categoryId !== effectiveCategoryFilter
      )
        return false;
      if (!needle) return true;
      const category = transaction.categoryId
        ? categoryMap.get(transaction.categoryId)
        : undefined;
      const account = accountMap.get(transaction.accountId);
      const destination = transaction.transferAccountId
        ? accountMap.get(transaction.transferAccountId)
        : undefined;
      return [
        transaction.merchant,
        transaction.notes,
        category?.name,
        account?.name,
        destination?.name,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(needle));
    });
  }, [
    monthTransactions,
    query,
    typeFilter,
    effectiveCategoryFilter,
    accountMap,
    categoryMap,
  ]);

  const activeFilters =
    typeFilter !== "all" || effectiveCategoryFilter !== "all";
  const listKey = [
    month,
    selectedAccount?.id ?? "",
    query.trim().toLowerCase(),
    typeFilter,
    effectiveCategoryFilter,
  ].join(":");
  const visibleCount =
    page.key === listKey ? page.count : TRANSACTIONS_PAGE_SIZE;
  const visibleTransactions = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  if (!ready) return null;

  if (!selectedAccount) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Activity"
          title="Transactions"
          description="Add a bank, cash source or credit card first, then record its entries here."
        />
        <EmptyState
          icon={<Wallet className="size-5" />}
          title="No accounts yet"
          description="Every transaction belongs to an account. Create your first one to get started."
          action={
            <Link
              href="/accounts"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              Add an account
            </Link>
          }
        />
      </div>
    );
  }

  const closingDisplay = accountDisplayBalance(selectedAccount, closingBalance);
  const openingDisplay = accountDisplayBalance(selectedAccount, openingBalance);
  const balanceLabel =
    selectedAccount.type === "credit_card"
      ? closingBalance > 0
        ? "Credit balance"
        : "Card owed"
      : closingBalance < 0
        ? "Overdrawn"
        : "Closing balance";
  const nextMonthLabel = formatMonth(addMonths(month, 1));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        description={`Every entry for ${selectedAccount.name} in ${formatMonth(
          month,
        )}. Only this account is shown; its balance carries forward.`}
        actions={<MonthPicker value={month} onChange={setMonth} />}
      />

      <div className="space-y-2">
        <div className="grid auto-rows-fr grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          <SummaryCard
            label="Spent"
            value={summary.expenses}
            currency={currency}
            icon={<ArrowUpRight className="size-3.5" />}
            tone="brand"
            hint="Expenses paid from this account this month."
          />
          <SummaryCard
            label="Income"
            value={summary.income}
            currency={currency}
            icon={<ArrowDownLeft className="size-3.5" />}
            tone="success"
            hint="Money received into this account this month."
          />
          <SummaryCard
            label="Net"
            value={summary.net}
            currency={currency}
            icon={<ArrowLeftRight className="size-3.5" />}
            tone={summary.net >= 0 ? "neutral" : "danger"}
            hint="Income minus spending. Transfers move the balance without counting as income."
          />
          <SummaryCard
            label={balanceLabel}
            value={closingDisplay}
            currency={currency}
            icon={
              selectedAccount.type === "credit_card" ? (
                <CreditCard className="size-3.5" />
              ) : (
                <Wallet className="size-3.5" />
              )
            }
            tone={
              (selectedAccount.type === "credit_card" && closingBalance < 0) ||
              closingBalance < 0
                ? "danger"
                : "neutral"
            }
            hint={`Opening ${formatMoney(openingDisplay, currency, {
              compact: true,
            })} · carries into ${nextMonthLabel}`}
          />
        </div>
        <p className="text-[10px] leading-snug text-subtle sm:hidden">
          Opening {formatMoney(openingDisplay, currency, { compact: true })} · carries into{" "}
          {nextMonthLabel}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={`Search ${selectedAccount.name} entries`}
              className="pl-10"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
              aria-label="Filter by type"
            >
              <option value="all">All types</option>
              <option value="expense">Expenses</option>
              <option value="income">Income</option>
              <option value="transfer">Transfers</option>
            </Select>
            <Select
              value={effectiveCategoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <p className="text-[11px] text-subtle">
              {filtered.length} of {monthTransactions.length} entries for{" "}
              {selectedAccount.name}
              {query ? ` matching “${query}”` : ""}
            </p>
            {activeFilters || query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTypeFilter("all");
                  setCategoryFilter("all");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-dark"
              >
                <FilterX className="size-3.5" />
                Clear filters
              </button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto_60px] gap-3 border-b border-line-soft bg-canvas/60 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle sm:grid">
          <span>Transaction</span>
          <span>Category</span>
          <span>Account</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        {filtered.length > 0 ? (
          <>
            <div className="divide-y divide-line-soft">
              {visibleTransactions.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  account={accountMap.get(transaction.accountId)}
                  category={
                    transaction.categoryId
                      ? categoryMap.get(transaction.categoryId)
                      : undefined
                  }
                  transferAccount={
                    transaction.transferAccountId
                      ? accountMap.get(transaction.transferAccountId)
                      : undefined
                  }
                  onClick={() => openTransaction(transaction)}
                  onEdit={() => openTransaction(transaction)}
                  onDelete={() => deleteTransaction(transaction.id)}
                  perspectiveAccountId={selectedAccount.id}
                />
              ))}
            </div>
            {hasMore ? (
              <div className="flex flex-col items-center justify-between gap-3 border-t border-line-soft bg-canvas/30 px-5 py-4 sm:flex-row">
                <p className="text-[11px] text-subtle">
                  Showing {visibleTransactions.length} of {filtered.length}{" "}
                  matching entries
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setPage({
                      key: listKey,
                      count: visibleCount + TRANSACTIONS_PAGE_SIZE,
                    })
                  }
                >
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            icon={<Search className="size-5" />}
            title={
              monthTransactions.length === 0
                ? "No transactions this month"
                : "Nothing matches those filters"
            }
            description={
              monthTransactions.length === 0
                ? `Add the first entry for ${selectedAccount.name} in ${formatMonth(
                    month,
                  )}.`
                : "Try a different search or clear the filters to see everything."
            }
            className="m-4 border-0 bg-canvas/60 py-10"
            action={
              monthTransactions.length === 0 ? (
                <Button size="sm" onClick={() => openTransaction()}>
                  <Plus className="size-3.5" />
                  Add transaction
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setTypeFilter("all");
                    setCategoryFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              )
            }
          />
        )}
      </Card>

      <div className="flex items-center justify-between gap-3 rounded-2xl border border-line-soft bg-white px-4 py-3">
        <div>
          <p className="text-xs font-semibold text-ink">
            {summary.count} entries for {selectedAccount.name} in{" "}
            {formatMonth(month)}
          </p>
          <p className="mt-0.5 text-[11px] text-subtle">
            Net {summary.net < 0 ? "−" : "+"}
            {formatMoney(summary.net, currency, { compact: true })} after spending
          </p>
        </div>
        <Badge variant={summary.net >= 0 ? "success" : "danger"}>
          {summary.income > 0
            ? `${formatPercent((summary.net / summary.income) * 100)} kept`
            : "No income"}
        </Badge>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  icon,
  tone,
  className,
  hint,
}: {
  label: string;
  value: number;
  currency: string;
  icon: React.ReactNode;
  tone: "brand" | "success" | "neutral" | "danger";
  className?: string;
  hint?: string;
}) {
  const styles = {
    brand: "text-brand bg-brand-soft",
    success: "text-success-dark bg-success-soft",
    neutral: "text-muted bg-canvas",
    danger: "text-danger bg-danger-soft",
  }[tone];
  return (
    <Card className={cn("p-3.5 sm:p-4", className)}>
      <div className="flex items-center gap-2">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", styles)}>
          {icon}
        </span>
        <span className="text-[11px] font-medium text-muted sm:text-xs">{label}</span>
      </div>
      <p
        className={cn(
          "mt-2 text-[17px] font-semibold tracking-[-0.03em] sm:text-[21px]",
          tone === "danger" ? "text-danger" : "text-ink",
        )}
      >
        <Money
          value={value}
          currency={currency}
          display="symbol"
          compact
        />
      </p>
      {hint ? (
        <p className="mt-1 hidden text-[10px] leading-snug text-subtle sm:block">
          {hint}
        </p>
      ) : null}
    </Card>
  );
}
