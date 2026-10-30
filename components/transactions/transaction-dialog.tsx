"use client";

import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Check,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { useAccountSelection } from "@/lib/account-selection";
import { useData } from "@/lib/data-context";
import { todayISO } from "@/lib/dates";
import type { Transaction, TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: { value: TransactionType; label: string; icon: ReactNode }[] = [
  { value: "expense", label: "Expense", icon: <ArrowUpRight className="size-3.5" /> },
  { value: "income", label: "Income", icon: <ArrowDownLeft className="size-3.5" /> },
  {
    value: "transfer",
    label: "Transfer",
    icon: <ArrowLeftRight className="size-3.5" />,
  },
];

export function TransactionDialog({
  open,
  onOpenChange,
  editing,
  defaultAccountId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Transaction | null;
  defaultAccountId?: string;
}) {
  if (!open) return null;
  return (
    <TransactionDialogContent
      key={`${editing?.id ?? "new"}:${defaultAccountId ?? ""}`}
      onOpenChange={onOpenChange}
      editing={editing}
      defaultAccountId={defaultAccountId}
    />
  );
}

function TransactionDialogContent({
  onOpenChange,
  editing,
  defaultAccountId,
}: {
  onOpenChange: (open: boolean) => void;
  editing?: Transaction | null;
  defaultAccountId?: string;
}) {
  const router = useRouter();
  const {
    accounts,
    categories,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useData();
  const { selectedAccountId, setSelectedAccountId } = useAccountSelection();
  const active = useMemo(
    () =>
      accounts.filter(
        (account) =>
          !account.isArchived ||
          account.id === editing?.accountId ||
          account.id === editing?.transferAccountId,
      ),
    [accounts, editing],
  );

  const initialAccountId =
    editing?.accountId ??
    (defaultAccountId &&
    active.some((account) => account.id === defaultAccountId)
      ? defaultAccountId
      : active.some((account) => account.id === selectedAccountId)
        ? selectedAccountId
        : active[0]?.id ?? "");
  const initialCurrency = active.find(
    (account) => account.id === initialAccountId,
  )?.currency;

  const [type, setType] = useState<TransactionType>(editing?.type ?? "expense");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [accountId, setAccountId] = useState(initialAccountId);
  const [categoryId, setCategoryId] = useState(
    editing?.categoryId ??
      categories.find(
        (category) => category.kind === (editing?.type ?? "expense"),
      )?.id ??
      "",
  );
  const [transferAccountId, setTransferAccountId] = useState(
    editing?.transferAccountId ??
      active.find(
        (account) =>
          account.id !== initialAccountId &&
          account.currency === initialCurrency,
      )?.id ??
      "",
  );
  const [occurredOn, setOccurredOn] = useState(editing?.occurredOn ?? todayISO());
  const [merchant, setMerchant] = useState(editing?.merchant ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categoryOptions = useMemo(
    () => categories.filter((category) => category.kind === type),
    [categories, type],
  );

  const sourceAccount = active.find((account) => account.id === accountId);
  const destinationAccount = active.find(
    (account) => account.id === transferAccountId,
  );

  function changeAccount(nextId: string) {
    setAccountId(nextId);
    setError(null);
    if (type !== "transfer") return;

    const nextCurrency = active.find((account) => account.id === nextId)?.currency;
    const currentDestination = active.find(
      (account) => account.id === transferAccountId,
    );
    if (
      !currentDestination ||
      currentDestination.id === nextId ||
      currentDestination.currency !== nextCurrency
    ) {
      setTransferAccountId(
        active.find(
          (account) =>
            account.id !== nextId && account.currency === nextCurrency,
        )?.id ?? "",
      );
    }
  }

  function changeType(next: TransactionType) {
    setType(next);
    setError(null);
    if (next !== "transfer") {
      const first = categories.find((category) => category.kind === next);
      setCategoryId(first?.id ?? "");
    } else {
      const sourceCurrency = active.find(
        (account) => account.id === accountId,
      )?.currency;
      const destination = active.find(
        (account) => account.id === transferAccountId,
      );
      if (
        !destination ||
        destination.id === accountId ||
        destination.currency !== sourceCurrency
      ) {
        setTransferAccountId(
          active.find(
            (account) =>
              account.id !== accountId &&
              account.currency === sourceCurrency,
          )?.id ?? "",
        );
      }
    }
  }

  async function handleSave() {
    setError(null);
    const numericAmount = Number(amount.replace(/,/g, ""));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!sourceAccount) {
      setError("Choose an account.");
      return;
    }
    if (!occurredOn || !/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
      setError("Choose a valid date.");
      return;
    }
    if (type === "transfer") {
      if (!destinationAccount) {
        setError("Choose the account receiving the transfer.");
        return;
      }
      if (destinationAccount.id === sourceAccount.id) {
        setError("Choose two different accounts.");
        return;
      }
      if (destinationAccount.currency !== sourceAccount.currency) {
        setError(
          `Transfers stay within ${sourceAccount.currency}. Choose another ${sourceAccount.currency} account.`,
        );
        return;
      }
    }

    setSaving(true);
    try {
      const input = {
        accountId: sourceAccount.id,
        categoryId: type === "transfer" ? null : categoryId || null,
        type,
        amount: numericAmount,
        currency: sourceAccount.currency,
        occurredOn,
        merchant:
          merchant.trim() ||
          (type === "transfer" && destinationAccount
            ? `Transfer to ${destinationAccount.name}`
            : type === "income"
              ? "Income"
              : "Expense"),
        notes: notes.trim() || null,
        transferAccountId:
          type === "transfer" ? destinationAccount?.id ?? null : null,
      };

      if (editing) {
        await updateTransaction(editing.id, input);
        toast.success("Transaction updated");
      } else {
        await addTransaction(input);
        toast.success(
          type === "transfer" ? "Transfer recorded" : "Transaction added",
        );
      }
      setSelectedAccountId(sourceAccount.id);
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save transaction.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!editing) return;
    setSaving(true);
    try {
      await deleteTransaction(editing.id);
      toast.success("Transaction deleted");
      onOpenChange(false);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete transaction.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={editing ? "Edit transaction" : "Add transaction"}
      description={
        editing
          ? "Update the details or remove this entry."
          : "A few details now make the month-end effortless."
      }
      footer={
        active.length === 0 ? undefined : (
          <div className="space-y-3">
            {error ? (
              <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
                {error}
              </p>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              {editing ? (
                confirmDelete ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={handleDelete}
                      loading={saving}
                    >
                      Delete
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
                    Delete
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
                <Button type="button" onClick={handleSave} loading={saving}>
                  {editing
                    ? "Save changes"
                    : `Save ${type === "transfer" ? "transfer" : "transaction"}`}
                </Button>
              </div>
            </div>
          </div>
        )
      }
    >
      {active.length === 0 ? (
        <div className="space-y-4 py-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
            <AppIcon name="credit-card" className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Add an account first</p>
            <p className="mt-1 text-xs text-muted">
              Every transaction needs a bank account, cash source or credit card.
            </p>
          </div>
          <Button
            onClick={() => {
              onOpenChange(false);
              router.push("/accounts");
            }}
          >
            Add an account
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[rgba(148,151,169,0.1)] p-1">
            {TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeType(option.value)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded-[9px] text-[13px] font-medium transition",
                  type === option.value
                    ? "bg-white text-ink shadow-[0_1px_4px_rgba(16,24,40,0.08)]"
                    : "text-muted hover:text-ink",
                )}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-line-soft bg-canvas px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
                Amount
              </span>
              <span className="text-[11px] text-subtle">
                {sourceAccount?.currency ?? "AED"}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-base font-semibold text-subtle">
                {sourceAccount?.currency ?? "AED"}
              </span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                autoFocus
                placeholder="0.00"
                className="tabular min-w-0 flex-1 bg-transparent text-[34px] font-semibold tracking-[-0.03em] text-ink outline-none placeholder:text-[#c7c8d2]"
                aria-label="Amount"
              />
            </div>
          </div>

          {type === "transfer" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="From">
                <Select
                  value={accountId}
                  onChange={(event) => changeAccount(event.target.value)}
                >
                  {active.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="To"
                hint={
                  sourceAccount
                    ? `${sourceAccount.currency} accounts only`
                    : undefined
                }
              >
                <Select
                  value={transferAccountId}
                  onChange={(event) => setTransferAccountId(event.target.value)}
                >
                  <option value="">Choose account</option>
                  {active
                    .filter(
                      (account) =>
                        account.id !== accountId &&
                        account.currency === sourceAccount?.currency,
                    )
                    .map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                </Select>
              </Field>
            </div>
          ) : (
            <>
              <Field label="Account">
                <Select
                  value={accountId}
                  onChange={(event) => changeAccount(event.target.value)}
                >
                  {active.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {account.currency}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Category"
                hint={categoryOptions.length ? undefined : "No categories yet"}
              >
                <div className="grid max-h-[188px] grid-cols-2 gap-2 overflow-y-auto pr-1 thin-scrollbar sm:grid-cols-3">
                  {categoryOptions.map((category) => {
                    const selected = categoryId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setCategoryId(category.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-xs font-medium transition",
                          selected
                            ? "border-brand bg-brand-soft text-brand-dark"
                            : "border-line-soft bg-white text-muted hover:border-line hover:text-ink",
                        )}
                      >
                        <span
                          className="flex size-6 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${category.color}14`,
                            color: category.color,
                          }}
                        >
                          <AppIcon name={category.icon} className="size-3.5" />
                        </span>
                        <span className="truncate">{category.name}</span>
                        {selected ? <Check className="ml-auto size-3 shrink-0" /> : null}
                      </button>
                    );
                  })}
                  {categoryOptions.length === 0 ? (
                    <p className="col-span-full rounded-xl border border-dashed border-line px-3 py-3 text-xs text-subtle">
                      Add a category in Settings.
                    </p>
                  ) : null}
                </div>
              </Field>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <Input
                type="date"
                value={occurredOn}
                onChange={(event) => setOccurredOn(event.target.value)}
              />
            </Field>
            {type === "transfer" ? (
              <Field label="Label" hint="optional">
                <Input
                  value={merchant}
                  onChange={(event) => setMerchant(event.target.value)}
                  placeholder="e.g. Card payment"
                />
              </Field>
            ) : (
              <Field label="Merchant" hint="optional">
                <Input
                  value={merchant}
                  onChange={(event) => setMerchant(event.target.value)}
                  placeholder={
                    type === "income" ? "e.g. Salary" : "e.g. Carrefour"
                  }
                />
              </Field>
            )}
          </div>

          <Field label="Note" hint="optional">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything worth remembering"
              rows={2}
            />
          </Field>

          {type === "transfer" ? (
            <div className="flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-xs text-brand-dark">
              <ArrowLeftRight className="size-3.5 shrink-0" />
              Transfers stay inside one currency and are excluded from spending.
            </div>
          ) : null}
        </div>
      )}
    </Dialog>
  );
}
