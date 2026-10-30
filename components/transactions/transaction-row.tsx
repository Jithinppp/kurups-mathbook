"use client";

import { ArrowLeftRight, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppIcon } from "@/components/app-icon";
import { Money } from "@/components/money";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatDate } from "@/lib/dates";
import type { Account, Category, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TransactionRow({
  transaction,
  account,
  category,
  transferAccount,
  onClick,
  onEdit,
  onDelete,
  compact = false,
  showDate = true,
  perspectiveAccountId,
}: {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  transferAccount?: Account;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<void> | void;
  compact?: boolean;
  showDate?: boolean;
  perspectiveAccountId?: string;
}) {
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const isTransfer = transaction.type === "transfer";
  const title =
    transaction.merchant ||
    (isTransfer && transferAccount
      ? `Transfer to ${transferAccount.name}`
      : category?.name ?? "Transaction");
  const subtitle = isTransfer
    ? `${account?.name ?? "Account"}${
        transferAccount ? ` → ${transferAccount.name}` : ""
      }`
    : `${category?.name ?? "Uncategorized"} · ${account?.name ?? "Account"}`;
  const icon = category?.icon ?? (isTransfer ? "arrow-left-right" : "wallet");
  const color = category?.color ?? "#5741d8";
  const perspective = perspectiveAccountId ?? transaction.accountId;
  const transferIn =
    isTransfer &&
    transaction.transferAccountId === perspective &&
    transaction.accountId !== perspective;
  const amount =
    transaction.type === "expense" || (isTransfer && !transferIn)
      ? -transaction.amount
      : transaction.amount;
  const amountClass =
    transaction.type === "income"
      ? "text-success-dark"
      : transaction.type === "expense"
        ? "text-ink"
        : "text-muted";
  const handleEdit = onEdit ?? onClick;
  const showActions = !compact && Boolean(handleEdit || onDelete);
  const typeLabel =
    transaction.type === "transfer"
      ? "Transfer"
      : transaction.type === "income"
        ? "Income"
        : "Expense";

  async function handleDelete() {
    if (!onDelete || deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await onDelete();
      setConfirmOpen(false);
      toast.success("Transaction deleted");
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete transaction.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 px-4 transition hover:bg-canvas/80 sm:gap-2 sm:px-5">
        <button
          type="button"
          onClick={() => setViewOpen(true)}
          aria-label={`View transaction: ${title}`}
          aria-haspopup="dialog"
          className={cn(
            "grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25",
            compact ? "py-2.5" : "py-3",
            "sm:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto]",
          )}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}14`, color }}
            >
              {isTransfer ? (
                <ArrowLeftRight className="size-4" strokeWidth={1.9} />
              ) : (
                <AppIcon name={icon} className="size-4" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-medium text-ink">
                {title}
              </span>
              <span className="mt-0.5 block text-[11px] text-subtle sm:truncate">
                {showDate ? `${formatDate(transaction.occurredOn)} · ` : ""}
                {subtitle}
              </span>
            </span>
          </span>

          <span className="hidden min-w-0 truncate text-xs text-muted sm:block">
            {isTransfer ? "Transfer" : category?.name ?? "Uncategorized"}
          </span>
          <span className="hidden min-w-0 truncate text-xs text-muted sm:block">
            {account?.name ?? "—"}
          </span>

          <span
            className={cn("tabular text-right text-[13px] font-semibold", amountClass)}
          >
            <Money
              value={amount}
              currency={transaction.currency}
              showSign
              codeClassName="text-[0.72em] font-medium text-subtle"
              display="symbol"
              compact
              compactFrom={1_000_000}
            />
          </span>
        </button>

        {showActions ? (
          <div className="flex shrink-0 items-center gap-0.5">
            {handleEdit ? (
              <button
                type="button"
                onClick={handleEdit}
                aria-label={`Edit ${title}`}
                title="Edit transaction"
                className="flex size-7 items-center justify-center rounded-lg text-subtle transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/25"
              >
                <Pencil className="size-3.5" />
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setConfirmOpen(true);
                }}
                aria-label={`Delete ${title}`}
                title="Delete transaction"
                className="flex size-7 items-center justify-center rounded-lg text-subtle transition hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/25"
              >
                <Trash2 className="size-3.5" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {viewOpen ? (
        <Dialog
          open
          onOpenChange={setViewOpen}
          title="Transaction details"
          description="A read-only view of this entry."
          footer={
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setViewOpen(false)}
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 rounded-2xl border border-line-soft bg-canvas px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}14`, color }}
                >
                  {isTransfer ? (
                    <ArrowLeftRight className="size-4" strokeWidth={1.9} />
                  ) : (
                    <AppIcon name={icon} className="size-4" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted">
                    {formatDate(transaction.occurredOn)} · {subtitle}
                  </p>
                </div>
              </div>
              <Money
                value={amount}
                currency={transaction.currency}
                showSign
                className="shrink-0 text-sm font-semibold"
                display="symbol"
                compact
                compactFrom={1_000_000}
              />
            </div>

            <dl className="space-y-3">
              <DetailLine label="Type" value={typeLabel} />
              <DetailLine
                label={isTransfer ? "From" : "Account"}
                value={account?.name ?? "—"}
              />
              {isTransfer ? (
                <DetailLine
                  label="Destination"
                  value={transferAccount?.name ?? "—"}
                />
              ) : (
                <DetailLine
                  label="Category"
                  value={category?.name ?? "Uncategorized"}
                />
              )}
              <DetailLine label="Currency" value={transaction.currency} />
              <DetailLine
                label="Date"
                value={formatDate(transaction.occurredOn)}
              />
              <DetailLine
                label="Note"
                value={transaction.notes?.trim() || "No note"}
              />
            </dl>
          </div>
        </Dialog>
      ) : null}

      {confirmOpen ? (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!deleting) setConfirmOpen(open);
          }}
          title="Delete transaction?"
          description="This entry will be removed from your ledger. It cannot be undone."
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
              >
                Keep it
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                loading={deleting}
              >
                Delete
              </Button>
            </div>
          }
        >
          <div className="rounded-2xl border border-line-soft bg-canvas px-4 py-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">{title}</p>
                <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p>
              </div>
              <Money
                value={amount}
                currency={transaction.currency}
                showSign
                className="shrink-0 text-sm font-semibold"
                display="symbol"
                compact
                compactFrom={1_000_000}
              />
            </div>
          </div>
          {deleteError ? (
            <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
              {deleteError}
            </p>
          ) : null}
        </Dialog>
      ) : null}
    </>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line-soft pb-3 last:border-0 last:pb-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">
        {label}
      </dt>
      <dd className="max-w-[68%] text-right text-[13px] font-medium text-ink">
        {value}
      </dd>
    </div>
  );
}
