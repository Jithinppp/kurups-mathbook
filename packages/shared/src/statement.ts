import { ACCOUNT_TYPE_LABEL } from "./constants";
import { daysInMonth, formatDate, formatMonth, monthStart, todayISO } from "./dates";
import {
  accountBalanceAt,
  accountDisplayBalance,
  accountOpeningBalanceAt,
  transactionsForAccountMonth,
} from "./finance";
import { formatMoney, formatNumber } from "./format";
import type { Account, Category, Transaction } from "./types";

export interface StatementRow {
  id: string;
  date: string;
  description: string;
  category: string;
  notes: string | null;
  debit: number | null;
  credit: number | null;
  balance: number;
}

export interface AccountStatement {
  accountId: string;
  accountName: string;
  accountType: string;
  accountTypeLabel: string;
  institution: string | null;
  accountNumber: string | null;
  currency: string;
  holderName: string;
  periodMonth: string;
  periodLabel: string;
  generatedOn: string;
  openingBalance: number;
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
  entryCount: number;
  rows: StatementRow[];
}

export function buildAccountStatement({
  account,
  accounts,
  categories,
  transactions,
  month,
  holderName,
}: {
  account: Account;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  month: string;
  holderName?: string;
}): AccountStatement {
  const accountMap = new Map(accounts.map((item) => [item.id, item]));
  const categoryMap = new Map(categories.map((item) => [item.id, item]));

  // Statements read oldest to newest. The app's lists stay newest first.
  const monthlyTransactions = transactionsForAccountMonth(
    transactions,
    account.id,
    month,
  )
    .slice()
    .sort((a, b) => {
      if (a.occurredOn !== b.occurredOn) {
        return a.occurredOn.localeCompare(b.occurredOn);
      }
      return a.createdAt.localeCompare(b.createdAt);
    });

  const openingSigned = accountOpeningBalanceAt(account, transactions, month);
  const closingSigned = accountBalanceAt(account, transactions, month);
  let runningSigned = openingSigned;
  let totalDebits = 0;
  let totalCredits = 0;

  const rows: StatementRow[] = monthlyTransactions.map((transaction) => {
    const isDestination =
      transaction.type === "transfer" &&
      transaction.transferAccountId === account.id &&
      transaction.accountId !== account.id;
    const isSource = transaction.accountId === account.id;
    const delta = isDestination
      ? transaction.amount
      : isSource
        ? transaction.type === "income"
          ? transaction.amount
          : -transaction.amount
        : 0;

    runningSigned += delta;

    const debit = delta < 0 ? Math.abs(delta) : null;
    const credit = delta > 0 ? delta : null;
    if (debit !== null) totalDebits += debit;
    if (credit !== null) totalCredits += credit;

    const category = transaction.categoryId
      ? categoryMap.get(transaction.categoryId)
      : undefined;
    const sourceAccount = accountMap.get(transaction.accountId);
    const destinationAccount = transaction.transferAccountId
      ? accountMap.get(transaction.transferAccountId)
      : undefined;

    let description = transaction.merchant.trim();
    if (!description) {
      if (transaction.type === "transfer") {
        description = isDestination
          ? `Transfer from ${sourceAccount?.name ?? "account"}`
          : `Transfer to ${destinationAccount?.name ?? "account"}`;
      } else {
        description = category?.name ?? "Transaction";
      }
    }

    return {
      id: transaction.id,
      date: transaction.occurredOn,
      description,
      category:
        transaction.type === "transfer"
          ? "Transfer"
          : category?.name ?? "Uncategorized",
      notes: transaction.notes?.trim() || null,
      debit,
      credit,
      balance: accountDisplayBalance(account, runningSigned),
    };
  });

  const lastDay = String(daysInMonth(month)).padStart(2, "0");
  const periodLabel = `${formatDate(monthStart(month), "long")} – ${formatDate(
    `${month}-${lastDay}`,
    "long",
  )}`;

  return {
    accountId: account.id,
    accountName: account.name,
    accountType: account.type,
    accountTypeLabel: ACCOUNT_TYPE_LABEL[account.type] ?? "Account",
    institution: account.institution,
    accountNumber: account.lastFour ? `Ending ${account.lastFour}` : null,
    currency: account.currency,
    holderName: holderName?.trim() || "Account holder",
    periodMonth: month,
    periodLabel,
    generatedOn: formatDate(todayISO(), "long"),
    openingBalance: accountDisplayBalance(account, openingSigned),
    closingBalance: accountDisplayBalance(account, closingSigned),
    totalDebits,
    totalCredits,
    entryCount: rows.length,
    rows,
  };
}

export function statementRowDescription(row: StatementRow) {
  return row.notes ? `${row.description} · ${row.notes}` : row.description;
}

export function statementFileName(
  statement: Pick<AccountStatement, "accountName" | "periodMonth">,
  extension: "pdf" | "xls",
) {
  const account = statement.accountName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42) || "account";

  return `asharibook-${account}-${statement.periodMonth}-statement.${extension}`;
}

export function statementWorkbookRows(
  statement: AccountStatement,
): (string | number)[][] {
  const tableRows = statement.rows.map((row) => [
    formatDate(row.date, "long"),
    statementRowDescription(row),
    row.category,
    row.debit ?? "",
    row.credit ?? "",
    row.balance,
  ]);

  return [
    ["AshariBook Account Statement"],
    ["Account holder", statement.holderName],
    ["Account", statement.accountName],
    ["Account type", statement.accountTypeLabel],
    ...(statement.institution
      ? [["Institution", statement.institution]]
      : []),
    ...(statement.accountNumber
      ? [["Account number", statement.accountNumber]]
      : []),
    ["Currency", statement.currency],
    ["Statement period", statement.periodLabel],
    ["Generated on", statement.generatedOn],
    [],
    ["Opening balance", "", "", "", "", statement.openingBalance],
    ["Total debits", "", "", statement.totalDebits, "", ""],
    ["Total credits", "", "", "", statement.totalCredits, ""],
    ["Closing balance", "", "", "", "", statement.closingBalance],
    [],
    [
      "Date",
      "Description",
      "Category",
      `Debit (${statement.currency})`,
      `Credit (${statement.currency})`,
      `Balance (${statement.currency})`,
    ],
    ...(tableRows.length
      ? tableRows
      : [["No transactions in this period.", "", "", "", "", ""]]),
  ];
}

export function buildStatementHtml(statement: AccountStatement) {
  const detailItems: [string, string][] = [
    ["Account holder", statement.holderName],
    ["Account", statement.accountName],
    ["Account type", statement.accountTypeLabel],
  ];
  if (statement.institution) {
    detailItems.push(["Institution", statement.institution]);
  }
  if (statement.accountNumber) {
    detailItems.push(["Account number", statement.accountNumber]);
  }
  detailItems.push(["Currency", statement.currency]);
  const detailHtml = detailItems
    .map(
      ([label, value]) =>
        `<div class="detail"><span class="detail-label">${escapeHtml(label)}</span><span class="detail-value">${escapeHtml(value)}</span></div>`,
    )
    .join("");

  const rows = statement.rows.length
    ? statement.rows
        .map(
          (row) => `
            <tr>
              <td class="date">${escapeHtml(formatDate(row.date, "long"))}</td>
              <td>
                <div class="description">${escapeHtml(statementRowDescription(row))}</div>
              </td>
              <td>${escapeHtml(row.category)}</td>
              <td class="amount">${row.debit === null ? "" : formatNumber(row.debit, 2)}</td>
              <td class="amount">${row.credit === null ? "" : formatNumber(row.credit, 2)}</td>
              <td class="amount balance">${formatNumber(row.balance, 2)}</td>
            </tr>`,
        )
        .join("")
    : `<tr><td colspan="6" class="empty">No transactions in this period.</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(statement.accountName)} statement</title>
  <style>
    @page { size: A4; margin: 16mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #101114;
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10px;
      line-height: 1.45;
    }
    .brand-bar { height: 7px; background: #7132f5; border-radius: 4px; }
    .header { display: flex; justify-content: space-between; gap: 24px; margin-top: 18px; }
    .brand { color: #7132f5; font-size: 20px; font-weight: 700; letter-spacing: -0.4px; }
    .title { margin-top: 4px; color: #101114; font-size: 16px; font-weight: 700; }
    .period { margin-top: 3px; color: #686b82; font-size: 10px; }
    .generated { color: #9497a9; font-size: 9px; text-align: right; white-space: nowrap; }
    .details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 24px;
      margin-top: 18px;
      padding: 14px 16px;
      border: 1px solid #ececf2;
      border-radius: 12px;
      background: #fafafc;
    }
    .detail { display: flex; gap: 8px; }
    .detail-label { width: 88px; color: #9497a9; font-size: 9px; }
    .detail-value { color: #101114; font-size: 10px; font-weight: 600; }
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 14px;
    }
    .summary-card {
      border: 1px solid #ececf2;
      border-radius: 10px;
      padding: 10px 11px;
      background: #ffffff;
    }
    .summary-label { color: #9497a9; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-value { margin-top: 4px; color: #101114; font-size: 12px; font-weight: 700; }
    .summary-value.debit { color: #b42318; }
    .summary-value.credit { color: #0e7a4d; }
    table { width: 100%; margin-top: 16px; border-collapse: collapse; }
    thead th {
      background: #7132f5;
      color: #ffffff;
      padding: 8px 8px;
      font-size: 8px;
      font-weight: 700;
      text-align: left;
      letter-spacing: 0.3px;
    }
    thead th.amount, tbody td.amount { text-align: right; }
    tbody td {
      border-bottom: 1px solid #ececf2;
      padding: 8px 8px;
      vertical-align: top;
      font-size: 9px;
    }
    tbody tr:nth-child(even) td { background: #fafafc; }
    td.date { width: 74px; color: #686b82; white-space: nowrap; }
    td.amount { width: 64px; white-space: nowrap; }
    td.balance { font-weight: 600; }
    .description { font-weight: 600; }
    .empty { padding: 24px 8px !important; color: #9497a9; text-align: center; }
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 18px;
      padding-top: 10px;
      border-top: 1px solid #ececf2;
      color: #9497a9;
      font-size: 8px;
    }
  </style>
</head>
<body>
  <div class="brand-bar"></div>
  <div class="header">
    <div>
      <div class="brand">AshariBook</div>
      <div class="title">Account statement</div>
      <div class="period">${escapeHtml(statement.periodLabel)}</div>
    </div>
    <div class="generated">Generated ${escapeHtml(statement.generatedOn)}</div>
  </div>

  <div class="details">
    ${detailHtml}
  </div>

  <div class="summary">
    <div class="summary-card"><div class="summary-label">Opening balance</div><div class="summary-value">${escapeHtml(formatMoney(statement.openingBalance, statement.currency))}</div></div>
    <div class="summary-card"><div class="summary-label">Total debits</div><div class="summary-value debit">${escapeHtml(formatMoney(statement.totalDebits, statement.currency))}</div></div>
    <div class="summary-card"><div class="summary-label">Total credits</div><div class="summary-value credit">${escapeHtml(formatMoney(statement.totalCredits, statement.currency))}</div></div>
    <div class="summary-card"><div class="summary-label">Closing balance</div><div class="summary-value">${escapeHtml(formatMoney(statement.closingBalance, statement.currency))}</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Category</th>
        <th class="amount">Debit (${escapeHtml(statement.currency)})</th>
        <th class="amount">Credit (${escapeHtml(statement.currency)})</th>
        <th class="amount">Balance (${escapeHtml(statement.currency)})</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <span>AshariBook · ${escapeHtml(statement.accountName)} · ${escapeHtml(formatMonth(statement.periodMonth, "long"))}</span>
    <span>${statement.entryCount} ${statement.entryCount === 1 ? "entry" : "entries"}</span>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
