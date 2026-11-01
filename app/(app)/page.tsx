"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  CreditCard,
  Plus,
  Sparkles,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { DonutChart, type DonutSegment } from "@/components/charts/donut-chart";
import { MonthlyBars } from "@/components/charts/monthly-bars";
import { Money } from "@/components/money";
import { MonthPicker } from "@/components/month-picker";
import { PageHeader } from "@/components/page-header";
import { TransactionRow } from "@/components/transactions/transaction-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { useAccountSelection } from "@/lib/account-selection";
import { useData } from "@/lib/data-context";
import { addMonths, currentMonthKey, formatMonth } from "@/lib/dates";
import {
  accountBalanceAt,
  accountBalanceCaption,
  accountDisplayBalance,
  budgetRows,
  monthlyTrend,
  overspentCategories,
  projectedSpend,
  spendingByCategory,
  summarizeTransactions,
  transactionsForAccount,
  transactionsForAccountMonth,
} from "@/lib/finance";
import { ACCOUNT_TYPE_LABEL } from "@/lib/constants";
import { formatMoney, formatPercent } from "@/lib/format";
import type { AccountWithBalance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuickAdd } from "@/components/quick-add";

export default function DashboardPage() {
  const { accounts, categories, transactions, budgets, profile, ready } =
    useData();
  const { activeAccounts, selectedAccount, setSelectedAccountId } =
    useAccountSelection();
  const { openTransaction } = useQuickAdd();
  const [month, setMonth] = useState(currentMonthKey());

  const accountId = selectedAccount?.id ?? "";
  const currency = selectedAccount?.currency ?? "AED";
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
  const rows = useMemo(
    () =>
      budgetRows(
        categories,
        monthTransactions,
        budgets,
        month,
        accountId,
        currency,
      ),
    [categories, monthTransactions, budgets, month, accountId, currency],
  );
  const budgetedRows = rows.filter((row) => row.budget);
  const totalBudget = budgetedRows.reduce(
    (total, row) => total + (row.budget?.amount ?? 0),
    0,
  );
  const budgetedSpent = budgetedRows.reduce((total, row) => total + row.spent, 0);
  const budgetLeft = totalBudget - budgetedSpent;
  const budgetPct = totalBudget > 0 ? (budgetedSpent / totalBudget) * 100 : 0;
  const over = overspentCategories(rows);
  const accountTransactions = useMemo(
    () =>
      selectedAccount
        ? transactionsForAccount(transactions, selectedAccount.id)
        : [],
    [transactions, selectedAccount],
  );
  const trend = useMemo(
    () => monthlyTrend(accountTransactions, month, 6),
    [accountTransactions, month],
  );
  const projected = projectedSpend(accountTransactions, month);
  const categorySpend = useMemo(
    () => spendingByCategory(monthTransactions),
    [monthTransactions],
  );
  const accountMap = useMemo(
    () => new Map(accounts.map((account) => [account.id, account])),
    [accounts],
  );
  const categoryMap = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const closingBalance = selectedAccount
    ? accountBalanceAt(selectedAccount, transactions, month)
    : 0;
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

  const segments = useMemo<DonutSegment[]>(() => {
    const items = Array.from(categorySpend.entries())
      .map(([id, value]) => {
        const category = categoryMap.get(id);
        return {
          label: category?.name ?? "Uncategorized",
          value,
          color: category?.color ?? "#9497a9",
        };
      })
      .sort((a, b) => b.value - a.value);
    if (items.length <= 5) return items;
    const top = items.slice(0, 5);
    const rest = items.slice(5).reduce((total, item) => total + item.value, 0);
    return [...top, { label: "Everything else", value: rest, color: "#c7c8d2" }];
  }, [categorySpend, categoryMap]);

  const firstName = (profile.fullName || "there").split(" ")[0];
  const monthLabel = formatMonth(month);
  const nextMonthLabel = formatMonth(addMonths(month, 1));
  const savingsRate =
    summary.income > 0 ? (summary.net / summary.income) * 100 : null;
  const lastMonth = trend[trend.length - 2];
  const currentTrend = trend[trend.length - 1];
  const monthDelta =
    lastMonth && lastMonth.expenses > 0
      ? ((currentTrend.expenses - lastMonth.expenses) / lastMonth.expenses) * 100
      : null;
  const averageSpend =
    trend.reduce((total, point) => total + point.expenses, 0) /
    Math.max(1, trend.length);

  if (!ready) return null;

  if (activeAccounts.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Your money"
          title={`Welcome, ${firstName}`}
          description="Start with the account that holds your everyday money. You can add cards and cash next."
          actions={<MonthPicker value={month} onChange={setMonth} />}
        />
        <EmptyState
          icon={<Wallet className="size-5" />}
          title="Add your first account"
          description="A bank account, a credit card or even the cash in your wallet. Everything starts there."
          action={
            <Link
              href="/accounts"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-white transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <Plus className="size-4" />
              Add an account
            </Link>
          }
        />
      </div>
    );
  }

  if (!selectedAccount) return null;

  const closingDisplay = accountDisplayBalance(selectedAccount, closingBalance);
  const isCard = selectedAccount.type === "credit_card";
  const balanceLabel = isCard
    ? closingBalance > 0
      ? "Credit balance"
      : "Card owed"
    : closingBalance < 0
      ? "Overdrawn"
      : "Closing balance";
  const availableCredit =
    isCard && selectedAccount.creditLimit
      ? Math.max(
          0,
          selectedAccount.creditLimit - Math.max(0, -closingBalance),
        )
      : null;
  const heroOverlay = Math.min(
    0.55,
    Math.max(0.14, relativeLuminance(selectedAccount.color) * 0.75),
  );

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow="Your money"
        title={`Welcome back, ${firstName}`}
        description={`A clear view of ${selectedAccount.name} in ${monthLabel}. Only this account's activity counts here, and its balance carries into ${nextMonthLabel}.`}
      />
      <div className="flex items-end gap-2">
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      <section
        className="relative overflow-hidden rounded-[24px] p-5 text-white sm:p-7 lg:p-8"
        style={{
          backgroundColor: selectedAccount.color,
          boxShadow: `0 18px 44px ${selectedAccount.color}38`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundColor: `rgba(16, 17, 20, ${heroOverlay})` }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-32 size-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-8 -top-16 size-[240px] rounded-full border border-white/10" />
        <div className="relative">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                All accounts
              </p>
              <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-white/50">
                Balances at the end of {monthLabel}. Pick an account to focus
                the page, or add an entry directly to any account.
              </p>
            </div>
            <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">
              {activeAccounts.length} active
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {activeAccounts.map((account) => (
              <OverviewAccountRow
                key={account.id}
                account={account}
                balance={monthBalanceByAccount.get(account.id) ?? account.balance}
                selected={account.id === selectedAccount.id}
                onSelect={() => setSelectedAccountId(account.id)}
                onAddTransaction={() =>
                  openTransaction(null, { accountId: account.id })
                }
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/transactions"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-white/65 transition hover:text-white"
            >
              View transactions
              <ChevronRight className="size-3.5" />
            </Link>
            <Link
              href="/accounts"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-white/65 transition hover:text-white"
            >
              Manage accounts
              <ChevronRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Spent this month"
          value={summary.expenses}
          currency={currency}
          hint={`${summary.count} ${
            summary.count === 1 ? "entry" : "entries"
          } for ${selectedAccount.name}`}
          icon={<ArrowUpRight className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Money in"
          value={summary.income}
          currency={currency}
          hint={
            savingsRate === null
              ? "No income recorded this month"
              : `${formatPercent(Math.max(0, savingsRate))} kept of income`
          }
          icon={<ArrowDownLeft className="size-4" />}
          tone="success"
        />
        <StatCard
          label={budgetLeft < 0 ? "Over budget" : "Budget left"}
          value={Math.abs(budgetLeft)}
          currency={currency}
          hint={
            totalBudget > 0
              ? `${formatPercent(budgetPct)} of ${formatMoney(
                  totalBudget,
                  currency,
                  { compact: true },
                )} used`
              : "No budgets set for this account this month"
          }
          icon={<Wallet className="size-4" />}
          tone={budgetLeft < 0 ? "danger" : "neutral"}
        />
        <StatCard
          label={balanceLabel}
          value={closingDisplay}
          currency={currency}
          hint={
            availableCredit !== null
              ? `${formatMoney(availableCredit, currency, { compact: true })} available`
              : `${monthLabel} close · carries into ${nextMonthLabel}`
          }
          icon={
            isCard ? (
              <CreditCard className="size-4" />
            ) : (
              <Wallet className="size-4" />
            )
          }
          tone={closingBalance < 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cash flow</CardTitle>
              <p className="mt-1 text-xs text-muted">
                {selectedAccount.name} expenses and income over the last six
                months.
              </p>
            </div>
            <Badge variant="brand">{selectedAccount.name} · 6 months</Badge>
          </CardHeader>
          <CardContent className="pt-5">
            <MonthlyBars
              data={trend}
              selectedMonth={month}
              currency={currency}
            />
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line-soft pt-4">
              <MiniMetric
                label="Avg. monthly spend"
                value={formatMoney(averageSpend, currency, { compact: true })}
              />
              <MiniMetric
                label="This month"
                value={formatMoney(summary.expenses, currency, { compact: true })}
              />
              <MiniMetric
                label="vs. last month"
                value={
                  monthDelta === null
                    ? "—"
                    : `${monthDelta > 0 ? "+" : ""}${formatPercent(monthDelta)}`
                }
                tone={monthDelta !== null && monthDelta > 0 ? "danger" : "success"}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Budget health</CardTitle>
              <p className="mt-1 text-xs text-muted">
                {monthLabel} · {selectedAccount.name}
              </p>
            </div>
            <Link
              href="/budgets"
              className="text-xs font-medium text-brand hover:text-brand-dark"
            >
              Edit
            </Link>
          </CardHeader>
          <CardContent className="pt-5">
            {totalBudget > 0 ? (
              <>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-subtle">
                      {budgetLeft < 0 ? "Over budget" : "Left to spend"}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-[28px] font-semibold tracking-[-0.035em]",
                        budgetLeft < 0 ? "text-danger" : "text-ink",
                      )}
                    >
                      <Money
                        value={Math.abs(budgetLeft)}
                        currency={currency}
                        display="symbol"
                        compact
                      />
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-lg px-2 py-1 text-[11px] font-semibold",
                      budgetLeft < 0
                        ? "bg-danger-soft text-danger"
                        : "bg-brand-soft text-brand",
                    )}
                  >
                    {formatPercent(budgetPct)}
                  </span>
                </div>
                <Progress
                  value={budgetPct}
                  className="mt-3"
                  indicatorClassName={
                    budgetLeft < 0 ? "bg-danger" : budgetPct > 85 ? "bg-warning" : "bg-brand"
                  }
                />

                {over.length > 0 ? (
                  <div className="mt-4 flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-[11px] leading-relaxed text-warning">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      <strong className="font-semibold">{over[0].category.name}</strong>{" "}
                      is {formatPercent(over[0].progress)} of budget.{" "}
                      {over.length > 1
                        ? `${over.length - 1} more ${
                            over.length - 1 === 1 ? "category is" : "categories are"
                          } over.`
                        : ""}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-[11px] text-success-dark">
                    <Sparkles className="size-3.5 shrink-0" />
                    Every category is inside its plan.
                  </div>
                )}

                <div className="mt-5 space-y-3">
                  {budgetedRows.slice(0, 4).map((row) => (
                    <div key={row.category.id} className="flex items-center gap-3">
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${row.category.color}14`,
                          color: row.category.color,
                        }}
                      >
                        <AppIcon name={row.category.icon} className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-xs font-medium text-ink">
                            {row.category.name}
                          </span>
                          <span
                            className={cn(
                              "tabular shrink-0 text-[10px] font-medium",
                              row.overspent ? "text-danger" : "text-subtle",
                            )}
                          >
                            {formatPercent(row.progress)}
                          </span>
                        </div>
                        <Progress
                          value={row.progress}
                          className="mt-1.5 h-1"
                          indicatorClassName={row.overspent ? "bg-danger" : "bg-brand"}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyState
                icon={<Wallet className="size-5" />}
                title={`Set a budget for ${selectedAccount.name}`}
                description={`Give ${selectedAccount.name} a monthly plan and see overspending before it happens.`}
                className="border-0 bg-canvas/60 py-8"
                action={
                  <Link
                    href="/budgets"
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-[13px] font-medium text-white hover:bg-brand-dark"
                  >
                    Set budgets
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent activity</CardTitle>
              <p className="mt-1 text-xs text-muted">
                The latest entries for {selectedAccount.name} in {monthLabel}.
              </p>
            </div>
            <Link
              href="/transactions"
              className="inline-flex items-center gap-0.5 text-xs font-medium text-brand hover:text-brand-dark"
            >
              View all
              <ChevronRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0 pt-3">
            {monthTransactions.length > 0 ? (
              <div className="divide-y divide-line-soft">
                {monthTransactions.slice(0, 6).map((transaction) => (
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
                    compact
                    perspectiveAccountId={selectedAccount.id}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ReceiptIcon />}
                title="Nothing recorded yet"
                description={`Add the first entry for ${selectedAccount.name} in ${monthLabel} and the rest of the dashboard will fill in.`}
                className="m-4 border-0 bg-canvas/60 py-8"
                action={
                  <Button size="sm" onClick={() => openTransaction()}>
                    <Plus className="size-3.5" />
                    Add transaction
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Where it went</CardTitle>
              <p className="mt-1 text-xs text-muted">
                {monthLabel} · {selectedAccount.name} by category
              </p>
            </div>
            {projected !== null ? (
              <Badge variant="neutral">
                {formatMoney(projected, currency, { compact: true })} projected
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="pt-5">
            <DonutChart
              segments={segments}
              total={summary.expenses}
              currency={currency}
              centerLabel="Spent"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  currency,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  hint: string;
  icon: React.ReactNode;
  tone: "brand" | "success" | "danger" | "neutral";
}) {
  const iconStyles = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success-soft text-success-dark",
    danger: "bg-danger-soft text-danger",
    neutral: "bg-canvas text-muted",
  }[tone];

  return (
    <Card className="p-3.5 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-medium text-muted sm:text-[12px]">{label}</span>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", iconStyles)}>
          {icon}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-[20px] font-semibold tracking-[-0.03em] sm:text-[23px]",
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
      <p className="mt-1 text-[10px] leading-relaxed text-subtle sm:text-[11px]">{hint}</p>
    </Card>
  );
}

/**
 * The account colour is the hero surface. Light colours get a stronger dark
 * wash so the white account list and labels stay readable.
 */
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
  onSelect: () => void;
  onAddTransaction: () => void;
}) {
  const display = accountDisplayBalance(account, balance);
  const caption = accountBalanceCaption(account, balance);
  const kind = ACCOUNT_TYPE_LABEL[account.type] ?? "Account";

  return (
    <div
      data-testid="overview-account-row"
      data-account-id={account.id}
      className={cn(
        "flex flex-col gap-2 rounded-xl border px-3 py-2.5 transition sm:flex-row sm:items-center sm:gap-3",
        selected
          ? "border-white/25 bg-white/15"
          : "border-white/10 bg-white/[0.06] hover:bg-white/10",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Select ${account.name}`}
        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <AppIcon name={account.icon} className="size-4" />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-white">
              {account.name}
            </span>
            {selected ? (
              <span className="shrink-0 rounded bg-white/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-white/80">
                Selected
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-white/55">
            {kind} · {account.currency}
            {account.institution ? ` · ${account.institution}` : ""}
            {account.lastFour ? ` · •••• ${account.lastFour}` : ""}
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="text-right">
          <p className="text-[9px] font-medium uppercase tracking-[0.1em] text-white/45">
            {caption}
          </p>
          <p className="mt-0.5 text-[15px] font-semibold tracking-[-0.02em] text-white">
            <Money
              value={display}
              currency={account.currency}
              display="symbol"
              compact
              codeClassName="text-white/55"
            />
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTransaction}
          aria-label={`Add transaction for ${account.name}`}
          className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-lg border border-white/20 px-2.5 text-[10px] font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Plus className="size-3.5" />
          Add transaction
        </button>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "danger" | "success";
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-subtle">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-[13px] font-semibold",
          tone === "danger"
            ? "text-danger"
            : tone === "success"
              ? "text-success-dark"
              : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function ReceiptIcon() {
  return <Wallet className="size-5" />;
}
