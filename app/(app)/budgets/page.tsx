"use client";

import {
  AlertTriangle,
  ChevronRight,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AccountSwitcher } from "@/components/account-switcher";
import { AppIcon } from "@/components/app-icon";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import { useAccountSelection } from "@/lib/account-selection";
import { SUGGESTED_BUDGETS } from "@/lib/constants";
import { useData } from "@/lib/data-context";
import { currentMonthKey, formatMonth } from "@/lib/dates";
import {
  budgetRows,
  overspentCategories,
  transactionsForAccountMonth,
  type BudgetRow,
} from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function BudgetsPage() {
  const { categories, transactions, budgets, setBudgets, ready } = useData();
  const { selectedAccount } = useAccountSelection();
  const [month] = useState(currentMonthKey());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetRow | null>(null);
  const [applying, setApplying] = useState(false);

  const accountId = selectedAccount?.id ?? "";
  const currency = selectedAccount?.currency ?? "AED";
  const suggestions = selectedAccount ? SUGGESTED_BUDGETS[currency] : undefined;
  const monthTransactions = useMemo(
    () =>
      selectedAccount
        ? transactionsForAccountMonth(transactions, selectedAccount.id, month)
        : [],
    [transactions, selectedAccount, month],
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
  const budgeted = rows.filter((row) => row.budget);
  const unbudgeted = rows.filter((row) => !row.budget);
  const totalBudget = budgeted.reduce(
    (total, row) => total + (row.budget?.amount ?? 0),
    0,
  );
  const spent = budgeted.reduce((total, row) => total + row.spent, 0);
  const remaining = totalBudget - spent;
  const progress = totalBudget > 0 ? (spent / totalBudget) * 100 : 0;
  const over = overspentCategories(rows);

  function openBudget(row: BudgetRow) {
    setEditing(row);
    setDialogOpen(true);
  }

  function openNew() {
    setEditing(unbudgeted[0] ?? budgeted[0] ?? null);
    setDialogOpen(true);
  }

  async function useSuggestedBudgets() {
    if (!selectedAccount) return;
    if (!suggestions) {
      toast.error(`No suggested budgets for ${currency}.`);
      return;
    }

    const inputs = categories
      .filter((category) => category.kind === "expense")
      .map((category) => ({
        accountId: selectedAccount.id,
        categoryId: category.id,
        month,
        amount: suggestions[category.name] ?? 0,
        currency,
      }))
      .filter((input) => input.amount > 0);

    if (inputs.length === 0) {
      toast.error("No suggested budgets match your categories.");
      return;
    }

    setApplying(true);
    try {
      await setBudgets(month, inputs);
      toast.success(`Suggested budgets applied to ${selectedAccount.name}`);
    } catch (applyError) {
      toast.error(
        applyError instanceof Error
          ? applyError.message
          : "Could not apply budgets.",
      );
    } finally {
      setApplying(false);
    }
  }

  if (!ready) return null;

  if (!selectedAccount) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Planning"
          title="Budgets"
          description="Add a bank, cash source or credit card first, then give it a monthly plan."
        />
        <EmptyState
          icon={<Wallet className="size-5" />}
          title="No accounts yet"
          description="Budgets belong to an account. Create your first account to start planning."
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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Budgets"
        description={`Give ${selectedAccount.name} a plan for ${formatMonth(
          month,
        )}. Only this account's expenses count; plans reset monthly and balances carry forward.`}
      />

      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <Button onClick={openNew}>
          <Plus className="size-4" />
          Set budget
        </Button>
        <AccountSwitcher label="Change account" />
      </div>

      <Card className="relative overflow-hidden border-brand/10 bg-brand-soft/60">
        <div className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full border border-brand/10" />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white text-brand shadow-[0_1px_4px_rgba(16,24,40,0.06)]">
                <Target className="size-4" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-dark">
                {formatMonth(month)} · {selectedAccount.name} plan
              </p>
            </div>
            <p className="mt-4 text-[11px] font-medium text-muted">
              {remaining < 0 ? "Over plan by" : "Left in the plan"}
            </p>
            <p
              className={cn(
                "mt-1 text-[34px] font-semibold tracking-[-0.04em] sm:text-[40px]",
                remaining < 0 ? "text-danger" : "text-ink",
              )}
            >
              <Money
                value={Math.abs(remaining)}
                currency={currency}
                display="symbol"
                compact
                compactFrom={1_000_000}
              />
            </p>
            <p className="mt-2 text-[11px] text-muted">
              {formatMoney(spent, currency, { compact: true })} spent of{" "}
              {formatMoney(totalBudget, currency, { compact: true })}
            </p>
            <Progress
              value={progress}
              className="mt-3 h-2 max-w-md"
              indicatorClassName={
                remaining < 0 ? "bg-danger" : progress > 85 ? "bg-warning" : "bg-brand"
              }
            />
          </div>

          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-0 lg:rounded-2xl lg:border lg:border-brand/10 lg:bg-white/70 lg:p-3">
            <SummaryMetric
              label="Budgeted"
              value={totalBudget}
              currency={currency}
            />
            <SummaryMetric label="Spent" value={spent} currency={currency} />
            <SummaryMetric
              label="Categories over"
              value={over.length}
              isCount
              tone={over.length > 0 ? "danger" : "success"}
            />
          </div>
        </div>
      </Card>

      {over.length > 0 ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-warning/15 bg-warning-soft px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-warning">
              <strong className="font-semibold">
                {over.map((row) => row.category.name).join(", ")}
              </strong>{" "}
              {over.length === 1 ? "is" : "are"} over budget this month. Adjust the
              plan or slow the spending.
            </p>
          </div>
          <Button
            variant="white"
            size="sm"
            onClick={() => openBudget(over[0])}
            className="shrink-0 self-start border-warning/20 text-warning hover:bg-white sm:self-auto"
          >
            Review {over[0].category.name}
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      ) : budgeted.length > 0 ? (
        <div className="flex items-center gap-2 rounded-2xl border border-success/15 bg-success-soft px-4 py-3 text-xs text-success-dark">
          <Sparkles className="size-4 shrink-0" />
          Everything budgeted is inside its plan. Keep it up.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Category budgets</CardTitle>
            <p className="mt-1 text-xs text-muted">
              {budgeted.length} planned · {unbudgeted.length} without a budget
            </p>
          </div>
          <div className="flex items-center gap-2">
            {budgeted.length === 0 && suggestions ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={useSuggestedBudgets}
                loading={applying}
                className="hidden sm:inline-flex"
              >
                Use suggested
              </Button>
            ) : null}
            <Button size="sm" onClick={openNew}>
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-3">
          {rows.length > 0 ? (
            <div className="divide-y divide-line-soft">
              {rows.map((row) => (
                <BudgetRowItem
                  key={row.category.id}
                  row={row}
                  onClick={() => openBudget(row)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Wallet className="size-5" />}
              title="No expense categories"
              description="Add a category in Settings, then come back to set its budget."
              className="m-4 border-0 bg-canvas/60 py-8"
            />
          )}
        </CardContent>
      </Card>

      {budgeted.length === 0 && suggestions ? (
        <Card className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">
                Not sure where to start?
              </p>
              <p className="mt-1 max-w-xl text-[12px] leading-relaxed text-muted">
                Apply a sensible starting plan based on the categories you
                already use. You can adjust every number afterwards.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={useSuggestedBudgets}
            loading={applying}
            className="shrink-0"
          >
            Use suggested budgets
          </Button>
        </Card>
      ) : null}

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        month={month}
        accountId={selectedAccount.id}
        currency={currency}
        editing={editing}
      />
    </div>
  );
}

function BudgetRowItem({
  row,
  onClick,
}: {
  row: BudgetRow;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-canvas/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25 sm:px-5"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${row.category.color}14`,
          color: row.category.color,
        }}
      >
        <AppIcon name={row.category.icon} className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[13px] font-medium text-ink">
              {row.category.name}
            </span>
            {row.overspent ? (
              <Badge variant="danger">Over</Badge>
            ) : row.budget && row.progress >= 85 ? (
              <Badge variant="warning">Close</Badge>
            ) : null}
          </div>
          <span className="tabular flex shrink-0 items-baseline gap-1 text-[11px] font-medium text-muted">
            {row.budget ? (
              <>
                <Money
                  value={row.spent}
                  currency={row.currency}
                  display="symbol"
                  compact
                />
                <span className="text-subtle">/</span>
                <Money
                  value={row.budget.amount}
                  currency={row.currency}
                  display="symbol"
                  compact
                />
              </>
            ) : (
              "No budget"
            )}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2.5">
          <Progress
            value={row.budget ? row.progress : 0}
            className="h-1.5 flex-1"
            indicatorClassName={
              row.overspent ? "bg-danger" : row.progress >= 85 ? "bg-warning" : "bg-brand"
            }
          />
          <span
            className={cn(
              "tabular w-10 text-right text-[10px] font-semibold",
              row.overspent ? "text-danger" : "text-subtle",
            )}
          >
            {row.budget ? formatPercent(row.progress) : "—"}
          </span>
        </div>
      </div>

      <span className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-subtle transition group-hover:bg-white group-hover:text-ink sm:flex">
        {row.budget ? <Pencil className="size-3.5" /> : <Plus className="size-4" />}
      </span>
    </button>
  );
}

function SummaryMetric({
  label,
  value,
  currency,
  isCount = false,
  tone = "neutral",
}: {
  label: string;
  value: number;
  currency?: string;
  isCount?: boolean;
  tone?: "neutral" | "danger" | "success";
}) {
  return (
    <div className="border-l border-brand/10 px-3 py-1 first:border-l-0 lg:flex lg:items-center lg:justify-between lg:border-l-0 lg:border-t lg:px-1 lg:py-2 lg:first:border-t-0">
      <p className="text-[10px] font-medium text-subtle">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-[13px] font-semibold lg:mt-0",
          tone === "danger"
            ? "text-danger"
            : tone === "success"
              ? "text-success-dark"
              : "text-ink",
        )}
      >
        {isCount ? (
          value
        ) : (
          <Money
            value={value}
            currency={currency ?? "AED"}
            display="symbol"
            compact
          />
        )}
      </p>
    </div>
  );
}
