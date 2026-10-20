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
import { useData } from "@/lib/data-context";
import { accountBalances, totals } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import type { Account, AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
  const { accounts, transactions, profile, restoreAccount } = useData();
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
  const stats = totals(balances);

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
        description="One place for bank accounts, cards and cash. Balances update as you record activity."
        actions={
          <Button onClick={() => openAdd("bank")} className="hidden sm:inline-flex">
            <Plus className="size-4" />
            Add account
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3">
        <Stat
          label="Total assets"
          value={stats.assets}
          hint="Bank and cash balances"
          icon={<ArrowUpRight className="size-4" />}
          tone="success"
        />
        <Stat
          label="Card balance"
          value={stats.owed}
          hint={
            stats.owed > 0
              ? `${formatMoney(stats.availableCredit, profile.baseCurrency)} credit available`
              : "Nothing outstanding"
          }
          icon={<ArrowDownRight className="size-4" />}
          tone="danger"
        />
        <Stat
          label="Net position"
          value={stats.net}
          hint={`${visible.length} active account${
            visible.length === 1 ? "" : "s"
          }${archived.length ? ` · ${archived.length} archived` : ""}`}
          icon={<ShieldCheck className="size-4" />}
          tone="brand"
          className="col-span-2 md:col-span-1"
        />
      </div>

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
                  Add card
                </button>
              }
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cards.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
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
                        value={
                          account.type === "credit_card"
                            ? Math.max(0, -account.balance)
                            : account.balance
                        }
                        currency={account.currency}
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
              expenses and transfers out. Credit card balances are negative when
              you owe money.
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

function Stat({
  label,
  value,
  hint,
  icon,
  tone,
  className,
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  tone: "brand" | "success" | "danger";
  className?: string;
}) {
  const styles = {
    brand: "bg-brand-soft text-brand",
    success: "bg-success-soft text-success-dark",
    danger: "bg-danger-soft text-danger",
  }[tone];
  return (
    <Card className={cn("p-3.5 sm:p-5", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted sm:text-xs">{label}</span>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", styles)}>
          {icon}
        </span>
      </div>
      <p className="mt-2.5 text-[20px] font-semibold tracking-[-0.03em] text-ink sm:mt-3 sm:text-[23px]">
        <Money value={value} />
      </p>
      <p className="mt-1 text-[10px] text-subtle sm:text-[11px]">{hint}</p>
    </Card>
  );
}
