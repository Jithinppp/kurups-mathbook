"use client";

import {
  Archive,
  ArchiveRestore,
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  CreditCard,
  Landmark,
  Plus,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { Money } from "@/components/money";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useAccountSelection } from "@/lib/account-selection";
import { currencyLabel } from "@/lib/constants";
import { useData } from "@/lib/data-context";
import {
  accountBalances,
  accountDisplayBalance,
  totalsByCurrency,
  type CurrencyTotals,
} from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const { accounts, transactions, restoreAccount } = useData();
  const { selectedAccount } = useAccountSelection();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [defaultType, setDefaultType] = useState<AccountType>("bank");
  const [showArchived, setShowArchived] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const balances = useMemo(
    () => accountBalances(accounts, transactions),
    [accounts, transactions],
  );
  const visible = balances.filter((account) => !account.isArchived);
  const archived = balances.filter((account) => account.isArchived);
  const cards = visible.filter((account) => account.type === "credit_card");
  const bankAndCash = visible.filter((account) => account.type !== "credit_card");
  const stats = totalsByCurrency(visible);

  function openAdd(type: AccountType) {
    setEditing(null);
    setDefaultType(type);
    setDialogOpen(true);
  }

  function openEdit(account: Account) {
    setEditing(account);
    setDialogOpen(true);
  }

  async function handleRestore(id: string) {
    setRestoringId(id);
    try {
      await restoreAccount(id);
      toast.success("Account restored");
    } catch (restoreError) {
      toast.error(
        restoreError instanceof Error
          ? restoreError.message
          : "Could not restore account.",
      );
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accounts"
        title="Everything you spend from"
        description="One place for bank accounts, cards and cash. Every balance stays in its account currency."
      />
      <div className="flex items-end gap-2">
        <Button onClick={() => openAdd("bank")} className="hidden sm:inline-flex">
          <Plus className="size-4" />
          Add account
        </Button>
      </div>

      {visible.length > 0 ? (
        <section>
          <div className="mb-3">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
              Currency positions
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Each currency is counted on its own. Nothing is converted.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {stats.map((position) => (
              <CurrencyPositionCard key={position.currency} position={position} />
            ))}
          </div>
        </section>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={<Wallet className="size-5" />}
          title="No accounts yet"
          description="Add a bank account, a credit card or the cash in your wallet to start recording transactions."
          action={
            <Button onClick={() => openAdd("bank")}>
              <Plus className="size-4" />
              Add your first account
            </Button>
          }
        />
      ) : (
        <>
          <section>
            <SectionHeader
              icon={<CreditCard className="size-4" />}
              title="Credit cards"
              count={cards.length}
              action={
                <button
                  type="button"
                  onClick={() => openAdd("credit_card")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark"
                >
                  <Plus className="size-3.5" />
                  Add credit card
                </button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  selected={account.id === selectedAccount?.id}
                  onClick={() => openEdit(account)}
                />
              ))}
              <button
                type="button"
                onClick={() => openAdd("credit_card")}
                className={cn(
                  "flex min-h-[140px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/50 p-5 text-center text-xs font-medium text-subtle transition hover:border-brand/30 hover:bg-brand-soft/40 hover:text-brand xl:min-h-[190px]",
                  spanClasses(cards.length, 3),
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(16,24,40,0.08)]">
                  <Plus className="size-4" />
                </span>
                Add a credit card
              </button>
            </div>
          </section>

          <section>
            <SectionHeader
              icon={<Landmark className="size-4" />}
              title="Bank & cash"
              count={bankAndCash.length}
              action={
                <button
                  type="button"
                  onClick={() => openAdd("bank")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark"
                >
                  <Plus className="size-3.5" />
                  Add account
                </button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {bankAndCash.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  selected={account.id === selectedAccount?.id}
                  onClick={() => openEdit(account)}
                />
              ))}
              <button
                type="button"
                onClick={() => openAdd("bank")}
                className={cn(
                  "flex min-h-[190px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-white/50 p-5 text-center text-xs font-medium text-subtle transition hover:border-brand/30 hover:bg-brand-soft/40 hover:text-brand",
                  spanClasses(bankAndCash.length, 4),
                )}
              >
                <span className="flex size-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(16,24,40,0.08)]">
                  <Plus className="size-4" />
                </span>
                Add a bank or cash account
              </button>
            </div>
          </section>
        </>
      )}

      {archived.length > 0 ? (
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setShowArchived((value) => !value)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-canvas/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/25"
          >
            <span className="flex items-center gap-2.5">
              <span className="flex size-8 items-center justify-center rounded-lg bg-canvas text-muted">
                <Archive className="size-4" />
              </span>
              <span>
                <span className="block text-[13px] font-semibold text-ink">
                  Archived accounts
                </span>
                <span className="block text-[11px] text-subtle">
                  {archived.length} hidden from active accounts
                </span>
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 text-subtle transition",
                showArchived && "rotate-180",
              )}
            />
          </button>
          {showArchived ? (
            <div className="divide-y divide-line-soft border-t border-line-soft px-4">
              {archived.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {account.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-subtle">
                      {account.type === "credit_card"
                        ? "Credit card"
                        : account.type === "cash"
                          ? "Cash"
                          : "Bank"}{" "}
                      ·{" "}
                      <Money
                        value={accountDisplayBalance(account, account.balance)}
                        currency={account.currency}
                        display="symbol"
                        compact
                      />
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleRestore(account.id)}
                    loading={restoringId === account.id}
                    className="shrink-0"
                  >
                    <ArchiveRestore className="size-3.5" />
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="flex flex-col gap-3 border-brand/10 bg-brand-soft/50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-[0_1px_4px_rgba(16,24,40,0.06)]">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-ink">
              How balances work
            </p>
            <p className="mt-0.5 max-w-2xl text-[11px] leading-relaxed text-muted">
              A balance is the opening amount plus income and transfers in, minus
              expenses and transfers out. It is always shown in the currency set
              on that account. Credit card balances are negative when you owe
              money, and a card&apos;s currency cannot change once it has activity.
            </p>
          </div>
        </div>
      </Card>

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultType={defaultType}
      />
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-white text-muted shadow-[0_1px_4px_rgba(16,24,40,0.06)]">
          {icon}
        </span>
        <div>
          <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
          <p className="text-[11px] text-subtle">
            {count} account{count === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
}

function spanClasses(count: number, columns: 3 | 4) {
  const smSpan = count % 2 === 0 ? 2 : 1;
  const remainder = count % columns;
  const xlSpan = remainder === 0 ? columns : columns - remainder;
  const smClass = smSpan === 2 ? "sm:col-span-2" : "sm:col-span-1";
  const xlClass =
    xlSpan === 1
      ? "xl:col-span-1"
      : xlSpan === 2
        ? "xl:col-span-2"
        : xlSpan === 3
          ? "xl:col-span-3"
          : "xl:col-span-4";
  return `${smClass} ${xlClass}`;
}

function CurrencyPositionCard({ position }: { position: CurrencyTotals }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-[11px] font-bold tracking-[0.04em] text-brand">
            {position.currency}
          </span>
          <div>
            <p className="text-[13px] font-semibold text-ink">
              {currencyLabel(position.currency)}
            </p>
            <p className="mt-0.5 text-[11px] text-subtle">
              {position.accountCount} active account
              {position.accountCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] font-medium uppercase tracking-[0.1em] text-subtle">
        Net position
      </p>
      <p className="mt-1 text-[25px] font-semibold tracking-[-0.03em] text-ink">
        <Money
          value={position.net}
          currency={position.currency}
          display="symbol"
          compact
        />
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium text-subtle">
            <ArrowUpRight className="size-3 text-success-dark" />
            Assets
          </p>
          <p className="mt-1 text-[13px] font-semibold text-ink">
            <Money
              value={position.assets}
              currency={position.currency}
              display="symbol"
              compact
            />
          </p>
        </div>
        <div>
          <p className="flex items-center gap-1 text-[10px] font-medium text-subtle">
            <ArrowDownRight className="size-3 text-danger" />
            Card owed
          </p>
          <p
            className={cn(
              "mt-1 text-[13px] font-semibold",
              position.owed > 0 ? "text-danger" : "text-ink",
            )}
          >
            <Money
              value={position.owed}
              currency={position.currency}
              display="symbol"
              compact
            />
          </p>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-subtle">
        {position.owed > 0
          ? `${formatMoney(position.availableCredit, position.currency, {
              compact: true,
            })} available · ${formatPercent(position.utilization)} of credit used`
          : "No card balance outstanding"}
      </p>
    </Card>
  );
}
