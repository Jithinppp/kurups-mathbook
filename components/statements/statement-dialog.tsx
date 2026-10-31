"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { useAccountSelection } from "@/lib/account-selection";
import { useData } from "@/lib/data-context";
import { formatMonth } from "@/lib/dates";
import { buildAccountStatement } from "@/lib/finance";
import { formatMoney } from "@/lib/format";
import {
  downloadStatementPdf,
  downloadStatementXls,
} from "@/lib/statement-export";

export function StatementDialog({
  open,
  onOpenChange,
  month,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
}) {
  const { accounts, categories, transactions, profile } = useData();
  const { selectedAccount } = useAccountSelection();
  const [busy, setBusy] = useState<"pdf" | "xls" | null>(null);

  const statement = useMemo(
    () =>
      selectedAccount
        ? buildAccountStatement({
            account: selectedAccount,
            accounts,
            categories,
            transactions,
            month,
            holderName: profile.fullName,
          })
        : null,
    [selectedAccount, accounts, categories, transactions, month, profile.fullName],
  );

  if (!selectedAccount || !statement) return null;

  async function handleDownload(format: "pdf" | "xls") {
    if (!statement) return;
    setBusy(format);
    try {
      if (format === "pdf") {
        await downloadStatementPdf(statement);
      } else {
        await downloadStatementXls(statement);
      }
      toast.success(
        `${format === "pdf" ? "PDF" : "Excel"} statement downloaded`,
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not download the statement.",
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Download statement"
      description={`${selectedAccount.name} · ${formatMonth(month)}`}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-line-soft bg-canvas/60 p-4">
          <div className="flex items-start gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: selectedAccount.color }}
            >
              <FileText className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">
                {statement.periodLabel}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {statement.entryCount}{" "}
                {statement.entryCount === 1 ? "entry" : "entries"} ·{" "}
                {statement.currency}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
                Opening
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatMoney(statement.openingBalance, statement.currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
                Closing
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">
                {formatMoney(statement.closingBalance, statement.currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
                Debits
              </p>
              <p className="mt-1 text-sm font-semibold text-danger">
                {formatMoney(statement.totalDebits, statement.currency)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
                Credits
              </p>
              <p className="mt-1 text-sm font-semibold text-success-dark">
                {formatMoney(statement.totalCredits, statement.currency)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleDownload("pdf")}
            disabled={busy !== null}
            className="flex items-center gap-3 rounded-2xl border border-line-soft bg-white p-3.5 text-left transition hover:border-brand/40 hover:bg-brand-soft/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <FileText className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">
                {busy === "pdf" ? "Preparing PDF…" : "PDF"}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                Print-ready A4 statement
              </span>
            </span>
            <Download className="size-4 shrink-0 text-subtle" />
          </button>

          <button
            type="button"
            onClick={() => handleDownload("xls")}
            disabled={busy !== null}
            className="flex items-center gap-3 rounded-2xl border border-line-soft bg-white p-3.5 text-left transition hover:border-brand/40 hover:bg-brand-soft/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success-dark">
              <FileSpreadsheet className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">
                {busy === "xls" ? "Preparing Excel…" : "Excel (.xls)"}
              </span>
              <span className="mt-0.5 block text-[11px] text-muted">
                Spreadsheet with every entry
              </span>
            </span>
            <Download className="size-4 shrink-0 text-subtle" />
          </button>
        </div>

        <p className="text-[11px] leading-relaxed text-subtle">
          Only this account&apos;s activity for the selected month is included.
          Fields we don&apos;t store, such as value dates, are left out.
        </p>
      </div>
    </Dialog>
  );
}
