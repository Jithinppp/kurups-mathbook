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
import { useData } from "@/lib/data-context";
import { currentMonthKey, formatMonth } from "@/lib/dates";
import {
  accountBalances,
  budgetRows,
  monthlyTrend,
  overspentCategories,
  projectedSpend,
  spendingByCategory,
  summarizeTransactions,
  totals,
  transactionsForMonth,
} from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";
import type { AccountWithBalance } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useQuickAdd } from "@/components/quick-add";

export default function DashboardPage() {
  const { accounts, categories, transactions, budgets, profile, ready } =
    useData();
  const { openTransaction } = useQuickAdd();
  const [month, setMonth] = useState(currentMonthKey());

  const allBalances = useMemo(
    () => accountBalances(accounts, transactions),
    [accounts, transactions],
  );
  const visibleBalances = useMemo(
    () => allBalances.filter((account) => !account.isArchived),
    [allBalances],
  );
  const stats = useMemo(() => totals(allBalances), [allBalances]);
  const monthTransactions = useMemo(
    () => transactionsForMonth(transactions, month),
    [transactions, month],
  );
  const summary = useMemo(
    () => summarizeTransactions(monthTransactions),
    [monthTransactions],
  );
  const rows = useMemo(
    () => budgetRows(categories, monthTransactions, budgets, month),
    [categories, monthTransactions, budgets, month],
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
  const trend = useMemo(
    () => monthlyTrend(transactions, month, 6),
    [transactions, month],
  );
  const projected = projectedSpend(transactions, month);
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

  if (ready && visibleBalances.length === 0) {
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

  return (
    <div className="space-y-6 sm:space-y-7">
      <PageHeader
        eyebrow="Your money"
        title={`Welcome back, ${firstName}`}
        description={`A clear view of everything you have, owe and spent in ${monthLabel}.`}
        actions={
          <>
            <MonthPicker value={month} onChange={setMonth} />
            <Button
              onClick={() => openTransaction()}
              className="hidden sm:inline-flex"
            >
              <Plus className="size-4" />
              Add transaction
            </Button>
          </>
        }
      />

      <section className="relative overflow-hidden rounded-[24px] bg-brand p-5 text-white shadow-[0_18px_44px_rgba(113,50,245,0.22)] sm:p-7 lg:p-8">
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
        <div className="relative grid gap-7 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">
                Net position
              </p>
              <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold">
                {profile.baseCurrency}
              </span>
            </div>
            <p className="mt-2 text-[38px] font-semibold leading-none tracking-[-0.045em] sm:text-[48px]">
              <Money
                value={stats.net}
                currency={profile.baseCurrency}
                className="max-w-full"
                codeClassName="text-white/60"
              />
            </p>
            <p className="mt-3 max-w-md text-[12px] leading-relaxed text-white/65 sm:text-[13px]">
              {formatMoney(stats.assets, profile.baseCurrency)} across your
              accounts, less {formatMoney(stats.owed, profile.baseCurrency)} on
              cards.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Button
                variant="white"
                onClick={() => openTransaction()}
                className="bg-white px-3.5 text-brand hover:bg-white/90 sm:px-4"
              >
                <Plus className="size-4" />
                Add transaction
              </Button>
              <Link
                href="/accounts"
                className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/20 px-3 text-sm font-medium text-white transition hover:bg-white/10 sm:px-4"
              >
                View accounts
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm lg:grid-cols-1 lg:gap-0 lg:p-4">
            <HeroStat
              label="In this month"
              shortLabel="In"
              value={summary.income}
            />
            <HeroStat
              label="Out this month"
              shortLabel="Out"
              value={summary.expenses}
            />
            <HeroStat
              label="Kept this month"
              shortLabel="Kept"
              value={summary.net}
              last
              positive={summary.net >= 0}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Spent this month"
          value={summary.expenses}
          hint={`${summary.count} transactions in ${monthLabel}`}
          icon={<ArrowUpRight className="size-4" />}
          tone="brand"
        />
        <StatCard
          label="Money in"
          value={summary.income}
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
          hint={
            totalBudget > 0
              ? `${formatPercent(budgetPct)} of ${formatMoney(
                  totalBudget,
                  profile.baseCurrency,
                )} used`
              : "No budgets set for this month"
          }
          icon={<Wallet className="size-4" />}
          tone={budgetLeft < 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Card balance"
          value={stats.owed}
          hint={
            stats.owed > 0
              ? `${formatMoney(stats.availableCredit, profile.baseCurrency)} available`
              : "No card balance outstanding"
          }
          icon={<CreditCard className="size-4" />}
          tone="neutral"
        />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              Your accounts
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {visibleBalances.length} active account
              {visibleBalances.length === 1 ? "" : "s"} in {profile.baseCurrency}
            </p>
          </div>
          <Link
            href="/accounts"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark"
          >
            Manage
            <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-6">
          {visibleBalances.map((account) => (
            <AccountMiniCard key={account.id} account={account} />
          ))}
          <Link
            href="/accounts"
            className="flex min-h-[118px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/55 p-4 text-center text-xs font-medium text-subtle transition hover:border-brand/30 hover:bg-brand-soft/40 hover:text-brand"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(16,24,40,0.08)]">
              <Plus className="size-4" />
            </span>
            Add account
          </Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Cash flow</CardTitle>
              <p className="mt-1 text-xs text-muted">
                Expenses and income over the last six months.
              </p>
            </div>
            <Badge variant="brand">6 months</Badge>
          </CardHeader>
          <CardContent className="pt-5">
            <MonthlyBars data={trend} selectedMonth={month} />
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-line-soft pt-4">
              <MiniMetric
                label="Avg. monthly spend"
                value={formatMoney(averageSpend, profile.baseCurrency)}
              />
              <MiniMetric
                label="This month"
                value={formatMoney(summary.expenses, profile.baseCurrency)}
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
              <p className="mt-1 text-xs text-muted">{monthLabel} plan</p>
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
                        currency={profile.baseCurrency}
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
                title="Set your first budget"
                description="Give next month a plan and see overspending before it happens."
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
                The latest entries in {monthLabel}.
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
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ReceiptIcon />}
                title="Nothing recorded yet"
                description={`Add the first entry for ${monthLabel} and the rest of the dashboard will fill in.`}
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
                {monthLabel} by category
              </p>
            </div>
            {projected !== null ? (
              <Badge variant="neutral">
                {formatMoney(projected, profile.baseCurrency)} projected
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="pt-5">
            <DonutChart
              segments={segments}
              total={summary.expenses}
              centerLabel="Spent"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  shortLabel,
  value,
  last = false,
  positive,
}: {
  label: string;
  shortLabel?: string;
  value: number;
  last?: boolean;
  positive?: boolean;
}) {
  return (
    <div
      className={cn(
        "px-1 py-1 lg:flex lg:items-center lg:justify-between lg:gap-4 lg:px-0 lg:py-3",
        !last &&
          "border-r border-white/15 pr-1.5 lg:border-r-0 lg:border-b lg:pr-0",
      )}
    >
      <span className="block text-[10px] font-medium uppercase tracking-[0.1em] text-white/60 lg:normal-case lg:tracking-normal lg:text-[11px]">
        <span className="lg:hidden">{shortLabel ?? label}</span>
        <span className="hidden lg:inline">{label}</span>
      </span>
      <span
        className={cn(
          "mt-1 block text-[13px] font-semibold sm:text-sm lg:mt-0",
          positive === false ? "text-[#ffd4cc]" : "text-white",
        )}
      >
        <Money value={value} currency="AED" codeClassName="text-white/55" />
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  tone,
}: {
  label: string;
  value: number;
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
        <Money value={value} />
      </p>
      <p className="mt-1 text-[10px] leading-relaxed text-subtle sm:text-[11px]">{hint}</p>
    </Card>
  );
}

function AccountMiniCard({ account }: { account: AccountWithBalance }) {
  const isCard = account.type === "credit_card";
  const display = isCard ? Math.max(0, -account.balance) : account.balance;
  return (
    <Link
      href="/accounts"
      className="group flex min-h-[118px] flex-col justify-between rounded-2xl border border-line-soft bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.02)] transition hover:-translate-y-0.5 hover:border-line focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${account.color}14`, color: account.color }}
        >
          <AppIcon name={account.icon} className="size-4" />
        </span>
        {isCard ? (
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-subtle">
            Due
          </span>
        ) : null}
      </div>
      <div>
        <p className="truncate text-[11px] font-medium text-muted">{account.name}</p>
        <p
          className={cn(
            "mt-0.5 text-[15px] font-semibold tracking-[-0.02em]",
            isCard ? "text-ink" : account.balance < 0 ? "text-danger" : "text-ink",
          )}
        >
          <Money value={display} currency={account.currency} />
        </p>
      </div>
    </Link>
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
