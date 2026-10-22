import type {
  Account,
  AccountInput,
  Budget,
  Category,
  Profile,
  Transaction,
  TransactionInput,
} from "../types";

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
}

export interface AccountRow {
  id: string;
  user_id: string;
  name: string;
  institution: string | null;
  type: Account["type"];
  currency: string;
  opening_balance: number | string;
  credit_limit: number | string | null;
  color: string;
  icon: string;
  last_four: string | null;
  is_archived: boolean;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  kind: Category["kind"];
  icon: string;
  color: string;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  type: Transaction["type"];
  amount: number | string;
  currency: string;
  occurred_on: string;
  merchant: string | null;
  notes: string | null;
  transfer_account_id: string | null;
  created_at: string;
}

export interface BudgetDbRow {
  id: string;
  user_id: string;
  account_id?: string | null;
  category_id: string;
  month: string;
  amount: number | string;
  currency?: string | null;
  created_at: string;
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    createdAt: row.created_at,
  };
}

export function mapAccount(row: AccountRow): Account {
  return {
    id: row.id,
    name: row.name,
    institution: row.institution,
    type: row.type,
    currency: row.currency,
    openingBalance: Number(row.opening_balance),
    creditLimit: row.credit_limit === null ? null : Number(row.credit_limit),
    color: row.color,
    icon: row.icon,
    lastFour: row.last_four,
    isArchived: row.is_archived,
    createdAt: row.created_at,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    icon: row.icon,
    color: row.color,
    createdAt: row.created_at,
  };
}

export function mapTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    categoryId: row.category_id,
    type: row.type,
    amount: Number(row.amount),
    currency: row.currency,
    occurredOn: row.occurred_on,
    merchant: row.merchant ?? "",
    notes: row.notes,
    transferAccountId: row.transfer_account_id,
    createdAt: row.created_at,
  };
}

export function mapBudget(row: BudgetDbRow): Budget {
  return {
    id: row.id,
    accountId: row.account_id ?? "",
    categoryId: row.category_id,
    month: row.month,
    amount: Number(row.amount),
    currency: row.currency || "AED",
  };
}

export function accountPayload(input: AccountInput) {
  return {
    name: input.name.trim(),
    institution: input.institution?.trim() || null,
    type: input.type,
    currency: input.currency,
    opening_balance: input.openingBalance,
    credit_limit: input.creditLimit ?? null,
    color: input.color,
    icon: input.icon,
    last_four: input.lastFour?.trim() || null,
  };
}

export function transactionPayload(input: TransactionInput) {
  return {
    account_id: input.accountId,
    category_id: input.type === "transfer" ? null : input.categoryId,
    type: input.type,
    amount: input.amount,
    currency: input.currency,
    occurred_on: input.occurredOn,
    merchant: input.merchant.trim() || "Untitled",
    notes: input.notes?.trim() || null,
    transfer_account_id:
      input.type === "transfer" ? input.transferAccountId ?? null : null,
  };
}
