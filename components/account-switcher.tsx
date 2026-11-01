"use client";

import { Check, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AppIcon } from "@/components/app-icon";
import { Money } from "@/components/money";
import { useAccountSelection } from "@/lib/account-selection";
import {
  accountBalanceCaption,
  accountDisplayBalance,
} from "@/lib/finance";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/utils";

function accountKind(account: Pick<Account, "type">) {
  if (account.type === "credit_card") return "Credit card";
  if (account.type === "cash") return "Cash";
  return "Bank";
}

export function AccountSwitcher({
  className,
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { activeAccounts, selectedAccount, selectedAccountId, setSelectedAccountId } =
    useAccountSelection();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const list = listRef.current;
    const selected = list?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (list && selected) {
      const listRect = list.getBoundingClientRect();
      const selectedRect = selected.getBoundingClientRect();
      if (selectedRect.top < listRect.top) {
        list.scrollTop -= listRect.top - selectedRect.top;
      } else if (selectedRect.bottom > listRect.bottom) {
        list.scrollTop += selectedRect.bottom - listRect.bottom;
      }
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!selectedAccount) return null;

  return (
    <div
      ref={rootRef}
      data-testid="account-switcher"
      className={cn("relative w-full sm:w-auto", className)}
    >
      <button
        ref={triggerRef}
        type="button"
        data-testid="account-switcher-trigger"
        onClick={() => setOpen((current) => !current)}
        aria-label={`Change account. Currently ${selectedAccount.name}`}
        title="Change account"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        className={cn(
          "flex h-11 w-full items-center gap-2.5 rounded-xl border border-line-soft bg-white px-3 text-left shadow-[0_1px_2px_rgba(16,24,40,0.03)] transition hover:border-line focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15",
          label
            ? "sm:min-w-[250px] sm:max-w-[320px]"
            : "sm:min-w-[205px] sm:max-w-[260px]",
        )}
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{
            backgroundColor: `${selectedAccount.color}14`,
            color: selectedAccount.color,
          }}
        >
          <AppIcon name={selectedAccount.icon} className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold text-ink">
            {label ?? selectedAccount.name}
          </span>
          <span className="block truncate text-[10px] text-subtle">
            {label ? `${selectedAccount.name} · ` : ""}
            {accountKind(selectedAccount)} · {selectedAccount.currency}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-subtle transition",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          data-testid="account-switcher-panel"
          className="mt-1.5 w-full overflow-hidden rounded-2xl border border-line-soft bg-white shadow-[0_18px_60px_rgba(16,17,20,0.16)] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+6px)] sm:z-50 sm:mt-0 sm:w-[340px]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-line-soft px-3 py-2.5">
            <div className="flex items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
                Choose account
              </p>
              <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[9px] font-medium text-subtle">
                {activeAccounts.length}
              </span>
            </div>
            <Link
              href="/accounts"
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-brand hover:text-brand-dark"
            >
              Manage
            </Link>
          </div>

          <div
            ref={listRef}
            className="thin-scrollbar max-h-[310px] overflow-y-auto p-1.5 sm:max-h-[min(58vh,440px)]"
          >
            {activeAccounts.map((account) => {
              const selected = account.id === selectedAccountId;
              const balance = accountDisplayBalance(account, account.balance);
              return (
                <button
                  key={account.id}
                  type="button"
                  data-account-id={account.id}
                  onClick={() => {
                    setSelectedAccountId(account.id);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  aria-pressed={selected}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left transition",
                    selected
                      ? "border-brand/15 bg-brand-soft/60"
                      : "border-transparent hover:bg-canvas",
                  )}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${account.color}14`,
                      color: account.color,
                    }}
                  >
                    <AppIcon name={account.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[12px] font-semibold text-ink">
                        {account.name}
                      </span>
                      {selected ? (
                        <Check className="size-3.5 shrink-0 text-brand" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-subtle">
                      {accountKind(account)} · {account.currency}
                      {account.lastFour ? ` · •••• ${account.lastFour}` : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[9px] font-medium uppercase tracking-[0.08em] text-subtle">
                      {accountBalanceCaption(account, account.balance)}
                    </span>
                    <Money
                      value={balance}
                      currency={account.currency}
                      className="mt-0.5 text-[12px] font-semibold"
                      display="symbol"
                      compact
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="border-t border-line-soft p-1.5">
            <Link
              href="/accounts"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-medium text-muted transition hover:bg-canvas hover:text-ink"
            >
              <Plus className="size-3.5" />
              Add account
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
