"use client";

import { Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { useData } from "@/lib/data-context";
import { formatMonth } from "@/lib/dates";
import type { BudgetRow } from "@/lib/finance";

export function BudgetDialog({
  open,
  onOpenChange,
  month,
  accountId,
  currency,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  accountId: string;
  currency: string;
  editing?: BudgetRow | null;
}) {
  if (!open) return null;
  return (
    <BudgetDialogContent
      key={`${editing?.category.id ?? "new"}-${accountId}-${currency}`}
      onOpenChange={onOpenChange}
      month={month}
      accountId={accountId}
      currency={currency}
      editing={editing}
    />
  );
}

function BudgetDialogContent({
  onOpenChange,
  month,
  accountId,
  currency,
  editing,
}: {
  onOpenChange: (open: boolean) => void;
  month: string;
  accountId: string;
  currency: string;
  editing?: BudgetRow | null;
}) {
  const { accounts, categories, budgets, setBudget, deleteBudget } = useData();
  const account = accounts.find((item) => item.id === accountId);
  const expenseCategories = useMemo(
    () => categories.filter((category) => category.kind === "expense"),
    [categories],
  );
  const initialCategoryId =
    editing?.category.id ?? expenseCategories[0]?.id ?? "";
  const initialBudget = budgets.find(
    (budget) =>
      budget.accountId === accountId &&
      budget.categoryId === initialCategoryId &&
      budget.month.startsWith(month),
  );
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [amount, setAmount] = useState(
    editing?.budget
      ? String(editing.budget.amount)
      : initialBudget
        ? String(initialBudget.amount)
        : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    setError(null);
    if (!categoryId) {
      setError("Choose a category.");
      return;
    }
    const value = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a budget greater than zero.");
      return;
    }

    setSaving(true);
    try {
      await setBudget({ accountId, categoryId, month, amount: value, currency });
      toast.success(
        budgets.some(
          (budget) =>
            budget.accountId === accountId &&
            budget.categoryId === categoryId &&
            budget.month.startsWith(month),
        )
          ? "Budget updated"
          : "Budget set",
      );
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save budget.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing?.budget) return;
    setSaving(true);
    try {
      await deleteBudget(editing.budget.id);
      toast.success("Budget removed");
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not remove budget.",
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = expenseCategories.find(
    (category) => category.id === categoryId,
  );
  const selectedBudget = budgets.find(
    (budget) =>
      budget.accountId === accountId &&
      budget.categoryId === categoryId &&
      budget.month.startsWith(month),
  );

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={editing?.budget ? "Edit budget" : "Set a budget"}
      description={
        account
          ? `Plan ${currency} spending for ${account.name} in ${formatMonth(month)}.`
          : `Plan ${currency} spending for this account in ${formatMonth(month)}.`
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <Field label="Category">
          <Select
            value={categoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              setCategoryId(nextCategoryId);
              const existing = budgets.find(
                (budget) =>
                  budget.accountId === accountId &&
                  budget.categoryId === nextCategoryId &&
                  budget.month.startsWith(month),
              );
              setAmount(existing ? String(existing.amount) : "");
            }}
            disabled={Boolean(editing?.budget)}
          >
            {expenseCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        {selectedCategory ? (
          <div className="flex items-center gap-3 rounded-xl border border-line-soft bg-canvas px-3.5 py-3">
            <span
              className="flex size-9 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${selectedCategory.color}14`,
                color: selectedCategory.color,
              }}
            >
              <AppIcon name={selectedCategory.icon} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-ink">
                {selectedCategory.name}
              </p>
              <p className="text-[11px] text-subtle">
                {selectedBudget
                  ? "Budget already set for this month"
                  : "Expense category"}
              </p>
            </div>
          </div>
        ) : null}

        <Field label={`Monthly budget (${currency})`}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-subtle">
              {currency}
            </span>
            <Input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="pl-12 text-base font-semibold"
              autoFocus
            />
          </div>
        </Field>

        {error ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          {editing?.budget ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  loading={saving}
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger-soft hover:text-danger"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-3.5" />
                Remove
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save budget
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
