"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  FilterX,
  Plus,
  Search,
} from "lucide-react";
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
import { useData } from "@/lib/data-context";
import { currentMonthKey, formatMonth } from "@/lib/dates";
import {
  summarizeTransactions,
  transactionsForMonth,
} from "@/lib/finance";
import { formatPercent, formatSignedMoney } from "@/lib/format";
import type { TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

type TypeFilter = "all" | TransactionType;

export default function TransactionsPage() {
  const { accounts, categories, transactions, profile } = useData();
  const { openTransaction } = useQuickAdd();
  const [month, setMonth] = useState(currentMonthKey());
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [accountFilter, setAccountFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const monthTransactions = useMemo(
    () => transactionsForMonth(transactions, month),
    [transactions, month],
  );
  const summary = useMemo(
    () => summarizeTransactions(monthTransactions),
    [monthTransactions],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return monthTransactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
      if (accountFilter !== "all") {
        if (
          transaction.accountId !== accountFilter &&
          transaction.transferAccountId !== accountFilter
        )
          return false;
      }
      if (categoryFilter !== "all" && transaction.categoryId !== categoryFilter)
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
    accountFilter,
    categoryFilter,
    accountMap,
    categoryMap,
  ]);

  const activeFilters =
    typeFilter !== "all" || accountFilter !== "all" || categoryFilter !== "all";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Transactions"
        description={`Every entry for ${formatMonth(month)}. Search, filter, and fix anything in a couple of taps.`}
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <Button
              onClick={() => openTransaction()}
              className="hidden sm:inline-flex"
            >
              <Plus className="size-4" />
              Add
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
        <SummaryCard
          label="Spent"
          value={summary.expenses}
          icon={<ArrowUpRight className="size-3.5" />}
          tone="brand"
        />
        <SummaryCard
          label="Income"
          value={summary.income}
          icon={<ArrowDownLeft className="size-3.5" />}
          tone="success"
        />
        <SummaryCard
          label="Net"
          value={summary.net}
          icon={<ArrowLeftRight className="size-3.5" />}
          tone={summary.net >= 0 ? "neutral" : "danger"}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search transactions"
              className="pl-10"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
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
              value={accountFilter}
              onChange={(event) => setAccountFilter(event.target.value)}
              aria-label="Filter by account"
            >
              <option value="all">All accounts</option>
              {accounts
                .filter((account) => !account.isArchived)
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </Select>
            <Select
              value={categoryFilter}
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
              {filtered.length} of {monthTransactions.length} entries
              {query ? ` matching “${query}”` : ""}
            </p>
            {activeFilters || query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setTypeFilter("all");
                  setAccountFilter("all");
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
        <div className="hidden grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto_20px] gap-3 border-b border-line-soft bg-canvas/60 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle sm:grid">
          <span>Transaction</span>
          <span>Category</span>
          <span>Account</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
        {filtered.length > 0 ? (
          <div className="divide-y divide-line-soft">
            {filtered.map((transaction) => (
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
              />
            ))}
          </div>
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
                ? `Add your first entry for ${formatMonth(month)}.`
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
                    setAccountFilter("all");
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
            {summary.count} entries in {formatMonth(month)}
          </p>
          <p className="mt-0.5 text-[11px] text-subtle">
            Net {formatSignedMoney(summary.net, profile.baseCurrency)} after spending
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
  icon,
  tone,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "brand" | "success" | "neutral" | "danger";
  className?: string;
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
        <Money value={value} />
      </p>
    </Card>
  );
}
