"use client";

import { ArrowLeftRight, ChevronRight } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { Money } from "@/components/money";
import { formatDate } from "@/lib/dates";
import type { Account, Category, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TransactionRow({
  transaction,
  account,
  category,
  transferAccount,
  onClick,
  compact = false,
  showDate = true,
}: {
  transaction: Transaction;
  account?: Account;
  category?: Category;
  transferAccount?: Account;
  onClick?: () => void;
  compact?: boolean;
  showDate?: boolean;
}) {
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
  const amountClass =
    transaction.type === "income"
      ? "text-success-dark"
      : transaction.type === "expense"
        ? "text-ink"
        : "text-muted";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 text-left transition hover:bg-canvas/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25 sm:px-5",
        compact ? "py-2.5" : "py-3",
        "sm:grid-cols-[minmax(0,1.45fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_auto_20px]",
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
          <span className="mt-0.5 block truncate text-[11px] text-subtle">
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

      <span className={cn("tabular text-right text-[13px] font-semibold", amountClass)}>
        <Money
          value={
            transaction.type === "expense"
              ? -transaction.amount
              : transaction.amount
          }
          currency={transaction.currency}
          showSign={transaction.type !== "transfer"}
          codeClassName="text-[0.72em] font-medium text-subtle"
        />
      </span>

      <ChevronRight className="hidden size-4 text-subtle opacity-0 transition group-hover:opacity-100 sm:block" />
    </button>
  );
}
