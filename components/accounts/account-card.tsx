"use client";

import { ArrowUpRight, CreditCard } from "lucide-react";
import { AppIcon } from "@/components/app-icon";
import { Money } from "@/components/money";
import type { AccountWithBalance } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AccountCard({
  account,
  onClick,
}: {
  account: AccountWithBalance;
  onClick?: () => void;
}) {
  if (account.type === "credit_card") {
    const debt = Math.max(0, -account.balance);
    const utilization = account.creditLimit
      ? Math.min(100, (debt / account.creditLimit) * 100)
      : 0;
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative min-h-[190px] overflow-hidden rounded-2xl p-5 text-left text-white shadow-[0_12px_32px_rgba(16,17,20,0.12)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/25"
        style={{ backgroundColor: account.color }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 size-44 rounded-full border border-white/15" />
        <div className="pointer-events-none absolute -right-2 top-2 size-24 rounded-full border border-white/10" />
        <div className="relative flex h-full flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                <AppIcon name={account.icon} className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold">{account.name}</span>
                <span className="block text-[10px] text-white/65">
                  {account.institution ?? "Credit card"}
                </span>
              </span>
            </div>
            <CreditCard className="size-5 text-white/60" />
          </div>

          <div className="mt-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/60">
              {account.balance > 0 ? "Credit balance" : "Outstanding"}
            </p>
            <p className="mt-1 text-[26px] font-semibold tracking-[-0.03em]">
              <Money
                value={account.balance > 0 ? account.balance : debt}
                currency={account.currency}
                codeClassName="text-white/65"
              />
            </p>
          </div>

          <div className="mt-auto pt-5">
            <div className="flex items-center justify-between text-[10px] text-white/60">
              <span>{account.creditLimit ? "Credit used" : "No limit set"}</span>
              <span>{account.creditLimit ? `${Math.round(utilization)}%` : "—"}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/20">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  utilization > 80 ? "bg-[#ffb4a8]" : "bg-white",
                )}
                style={{ width: `${utilization}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-white/65">
              <span>•••• {account.lastFour ?? "••••"}</span>
              {account.creditLimit ? (
                <span>
                  {new Intl.NumberFormat("en-AE").format(account.creditLimit)}{" "}
                  {account.currency} limit
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[190px] flex-col rounded-2xl border border-line-soft bg-white p-5 text-left shadow-[0_4px_24px_rgba(0,0,0,0.025)] transition hover:-translate-y-0.5 hover:border-line focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${account.color}14`, color: account.color }}
        >
          <AppIcon name={account.icon} className="size-[18px]" />
        </span>
        <span className="rounded-md bg-canvas px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
          {account.type === "cash" ? "Cash" : "Bank"}
        </span>
      </div>
      <div className="mt-4">
        <p className="truncate text-[13px] font-semibold text-ink">{account.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-subtle">
          {account.institution ??
            (account.type === "cash" ? "Cash source" : "Personal account")}
          {account.lastFour ? ` · •••• ${account.lastFour}` : ""}
        </p>
      </div>
      <div className="mt-auto pt-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
          Balance
        </p>
        <p
          className={cn(
            "mt-1 text-[24px] font-semibold tracking-[-0.03em]",
            account.balance < 0 ? "text-danger" : "text-ink",
          )}
        >
          <Money value={account.balance} currency={account.currency} />
        </p>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-brand opacity-0 transition group-hover:opacity-100">
        Edit account <ArrowUpRight className="size-3" />
      </span>
    </button>
  );
}
