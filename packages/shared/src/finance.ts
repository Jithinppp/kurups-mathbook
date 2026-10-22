import { addMonths, currentMonthKey, daysInMonth, dayOfMonth, monthRange } from "./dates";
import { sortCurrencies } from "./constants";
import type {
  Account,
  AccountWithBalance,
  Budget,
  Category,
  Transaction,
} from "./types";

export function accountBalances(
  accounts: Account[],
  transactions: Transaction[],
): AccountWithBalance[] {
  const balances = new Map<string, number>(
    accounts.map((account) => [account.id, account.openingBalance]),
  );

  for (const transaction of transactions) {
    const source = balances.get(transaction.accountId);
    if (source !== undefined) {
      if (transaction.type === "income") {
        balances.set(transaction.accountId, source + transaction.amount);
      } else {
        balances.set(transaction.accountId, source - transaction.amount);
      }
    }

    if (transaction.type === "transfer" && transaction.transferAccountId) {
      const destination = balances.get(transaction.transferAccountId);
      if (destination !== undefined) {
        balances.set(transaction.transferAccountId, destination + transaction.amount);
      }
    }
  }

  return accounts.map((account) => ({
    ...account,
    balance: balances.get(account.id) ?? account.openingBalance,
  }));
}

export function activeAccounts(accounts: Account[]) {
  return accounts.filter((account) => !account.isArchived);
}

export function transactionsForMonth(transactions: Transaction[], month: string) {
  return transactions
    .filter((transaction) => transaction.occurredOn.startsWith(month))
    .sort((a, b) => {
      if (a.occurredOn === b.occurredOn) return b.createdAt.localeCompare(a.createdAt);
      return b.occurredOn.localeCompare(a.occurredOn);
    });
}

/**
 * Every entry that touches an account, including both sides of a transfer.
 * This is the scope used by the account switcher and the activity page.
 */
export function transactionsForAccount(
  transactions: Transaction[],
  accountId: string,
) {
  return transactions.filter(
    (transaction) =>
      transaction.accountId === accountId ||
      transaction.transferAccountId === accountId,
  );
}

export function transactionsForAccountMonth(
  transactions: Transaction[],
  accountId: string,
  month: string,
) {
  return transactionsForMonth(
    transactionsForAccount(transactions, accountId),
    month,
  );
}

/**
 * Closing balance for an account at the end of a month. The next month opens
 * with this amount, so monthly reports stay separate while balances carry.
 */
export function accountBalanceAt(
  account: Pick<Account, "id" | "openingBalance">,
  transactions: Transaction[],
  month: string,
) {
  let balance = account.openingBalance;

  for (const transaction of transactions) {
    if (transaction.occurredOn.slice(0, 7) > month) continue;

    if (transaction.accountId === account.id) {
      balance +=
        transaction.type === "income" ? transaction.amount : -transaction.amount;
    }

    if (
      transaction.type === "transfer" &&
      transaction.transferAccountId === account.id
    ) {
      balance += transaction.amount;
    }
  }

  return balance;
}

export function accountOpeningBalanceAt(
  account: Pick<Account, "id" | "openingBalance">,
  transactions: Transaction[],
  month: string,
) {
  return accountBalanceAt(account, transactions, addMonths(month, -1));
}

/**
 * Credit cards are easier to scan as a positive amount owed. Banks and cash
 * keep their signed balance so an overdraft is still visible.
 */
export function accountDisplayBalance(
  account: Pick<Account, "type">,
  balance: number,
) {
  return account.type === "credit_card" ? Math.abs(balance) : balance;
}

export function accountBalanceCaption(
  account: Pick<Account, "type">,
  balance: number,
) {
  if (account.type === "credit_card") {
    return balance > 0 ? "Credit balance" : "Outstanding";
  }
  return balance < 0 ? "Overdrawn" : "Balance";
}

export function summarizeTransactions(transactions: Transaction[]) {
  let expenses = 0;
  let income = 0;
  let transfers = 0;

  for (const transaction of transactions) {
    if (transaction.type === "expense") expenses += transaction.amount;
    if (transaction.type === "income") income += transaction.amount;
    if (transaction.type === "transfer") transfers += transaction.amount;
  }

  return {
    expenses,
    income,
    transfers,
    net: income - expenses,
    count: transactions.length,
  };
}

export function spendingByCategory(transactions: Transaction[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    const key = transaction.categoryId ?? "uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + transaction.amount);
  }
  return totals;
}

export function spendingByAccount(transactions: Transaction[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    totals.set(
      transaction.accountId,
      (totals.get(transaction.accountId) ?? 0) + transaction.amount,
    );
  }
  return totals;
}

export interface BudgetRow {
  category: Category;
  budget: Budget | null;
  currency: string;
  spent: number;
  remaining: number;
  progress: number;
  overspent: boolean;
}

export function budgetRows(
  categories: Category[],
  transactions: Transaction[],
  budgets: Budget[],
  month: string,
  accountId: string,
  currency: string,
): BudgetRow[] {
  const spentMap = spendingByCategory(
    transactions.filter(
      (transaction) =>
        transaction.accountId === accountId &&
        transaction.type === "expense" &&
        transaction.occurredOn.startsWith(month),
    ),
  );
  const monthBudgets = new Map(
    budgets
      .filter(
        (budget) =>
          budget.accountId === accountId && budget.month.startsWith(month),
      )
      .map((budget) => [budget.categoryId, budget]),
  );

  return categories
    .filter((category) => category.kind === "expense")
    .map((category) => {
      const budget = monthBudgets.get(category.id) ?? null;
      const spent = spentMap.get(category.id) ?? 0;
      const remaining = (budget?.amount ?? 0) - spent;
      const progress = budget && budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      return {
        category,
        budget,
        currency,
        spent,
        remaining,
        progress,
        overspent: Boolean(budget && spent > budget.amount),
      };
    })
    .sort((a, b) => {
      if (a.budget && !b.budget) return -1;
      if (!a.budget && b.budget) return 1;
      return b.spent - a.spent;
    });
}

export interface MonthPoint {
  month: string;
  expenses: number;
  income: number;
}

export function monthlyTrend(
  transactions: Transaction[],
  endMonth = currentMonthKey(),
  count = 6,
): MonthPoint[] {
  const months = monthRange(count, endMonth);
  const points = new Map<string, MonthPoint>(
    months.map((month) => [month, { month, expenses: 0, income: 0 }]),
  );

  for (const transaction of transactions) {
    const month = transaction.occurredOn.slice(0, 7);
    const point = points.get(month);
    if (!point) continue;
    if (transaction.type === "expense") point.expenses += transaction.amount;
    if (transaction.type === "income") point.income += transaction.amount;
  }

  return months.map((month) => points.get(month)!);
}

export function monthExpenseTotal(transactions: Transaction[], month: string) {
  return transactionsForMonth(transactions, month)
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
}

export function projectedSpend(transactions: Transaction[], month: string) {
  if (month !== currentMonthKey()) return null;
  const spent = monthExpenseTotal(transactions, month);
  const elapsed = Math.max(dayOfMonth(), 1);
  return (spent / elapsed) * daysInMonth(month);
}

export function previousMonth(month: string) {
  return addMonths(month, -1);
}

export interface CurrencyTotals {
  currency: string;
  net: number;
  assets: number;
  owed: number;
  availableCredit: number;
  utilization: number;
  accountCount: number;
}

/**
 * Positions are grouped by the currency of the account. Nothing is converted,
 * so an AED total and an INR total can never be added together.
 */
export function totalsByCurrency(accounts: AccountWithBalance[]): CurrencyTotals[] {
  const totals = new Map<string, CurrencyTotals>();

  for (const account of accounts) {
    const entry = totals.get(account.currency) ?? {
      currency: account.currency,
      net: 0,
      assets: 0,
      owed: 0,
      availableCredit: 0,
      utilization: 0,
      accountCount: 0,
    };

    entry.accountCount += 1;
    entry.net += account.balance;
    if (account.balance > 0) entry.assets += account.balance;

    if (account.type === "credit_card") {
      const debt = Math.max(0, -account.balance);
      entry.owed += debt;
      if (account.creditLimit) {
        entry.availableCredit += Math.max(0, account.creditLimit - debt);
      }
    }

    totals.set(account.currency, entry);
  }

  for (const entry of totals.values()) {
    const limit = accounts
      .filter(
        (account) =>
          account.currency === entry.currency && account.type === "credit_card",
      )
      .reduce((total, account) => total + (account.creditLimit ?? 0), 0);
    entry.utilization = limit > 0 ? (entry.owed / limit) * 100 : 0;
  }

  return sortCurrencies(totals.keys()).map((currency) => totals.get(currency)!);
}

export function currenciesForAccounts(
  accounts: { currency: string }[],
) {
  return sortCurrencies(accounts.map((account) => account.currency));
}

export function overspentCategories(rows: BudgetRow[]) {
  return rows
    .filter((row) => row.overspent)
    .sort((a, b) => b.progress - a.progress);
}

export function isTransferTo(transaction: Transaction, accountId: string) {
  return transaction.transferAccountId === accountId;
}
