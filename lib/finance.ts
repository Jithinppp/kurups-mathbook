import { addMonths, currentMonthKey, daysInMonth, dayOfMonth, monthRange } from "./dates";
import { rateForCurrency } from "./constants";
import type {
  Account,
  AccountWithBalance,
  Budget,
  Category,
  Transaction,
} from "./types";

export function transactionBase(transaction: Transaction) {
  return transaction.baseAmount ?? transaction.amount * transaction.fxRate;
}

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

export function summarizeTransactions(transactions: Transaction[]) {
  let expenses = 0;
  let income = 0;
  let transfers = 0;

  for (const transaction of transactions) {
    const amount = transactionBase(transaction);
    if (transaction.type === "expense") expenses += amount;
    if (transaction.type === "income") income += amount;
    if (transaction.type === "transfer") transfers += amount;
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
    totals.set(key, (totals.get(key) ?? 0) + transactionBase(transaction));
  }
  return totals;
}

export function spendingByAccount(transactions: Transaction[]) {
  const totals = new Map<string, number>();
  for (const transaction of transactions) {
    if (transaction.type !== "expense") continue;
    totals.set(
      transaction.accountId,
      (totals.get(transaction.accountId) ?? 0) + transactionBase(transaction),
    );
  }
  return totals;
}

export interface BudgetRow {
  category: Category;
  budget: Budget | null;
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
): BudgetRow[] {
  const spentMap = spendingByCategory(transactions);
  const monthBudgets = new Map(
    budgets
      .filter((budget) => budget.month.startsWith(month))
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
    const amount = transactionBase(transaction);
    if (transaction.type === "expense") point.expenses += amount;
    if (transaction.type === "income") point.income += amount;
  }

  return months.map((month) => points.get(month)!);
}

export function monthExpenseTotal(transactions: Transaction[], month: string) {
  return transactionsForMonth(transactions, month)
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transactionBase(transaction), 0);
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

export interface Totals {
  net: number;
  assets: number;
  owed: number;
  availableCredit: number;
  utilization: number;
}

export function totals(accounts: AccountWithBalance[]): Totals {
  let net = 0;
  let assets = 0;
  let owed = 0;
  let availableCredit = 0;
  let limit = 0;

  for (const account of accounts) {
    const baseBalance = account.balance * rateForCurrency(account.currency);
    net += baseBalance;
    if (baseBalance > 0) assets += baseBalance;
    if (account.type === "credit_card") {
      const debt = Math.max(0, -baseBalance);
      owed += debt;
      if (account.creditLimit) {
        const baseLimit = account.creditLimit * rateForCurrency(account.currency);
        limit += baseLimit;
        availableCredit += Math.max(0, baseLimit - debt);
      }
    }
  }

  return {
    net,
    assets,
    owed,
    availableCredit,
    utilization: limit > 0 ? (owed / limit) * 100 : 0,
  };
}

export function overspentCategories(rows: BudgetRow[]) {
  return rows
    .filter((row) => row.overspent)
    .sort((a, b) => b.progress - a.progress);
}

export function isTransferTo(transaction: Transaction, accountId: string) {
  return transaction.transferAccountId === accountId;
}
