export type AccountType = "bank" | "cash" | "credit_card";
export type TransactionType = "expense" | "income" | "transfer";
export type CategoryKind = "expense" | "income";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  isDemo: boolean;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  baseCurrency: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  institution: string | null;
  type: AccountType;
  currency: string;
  openingBalance: number;
  creditLimit: number | null;
  color: string;
  icon: string;
  lastFour: string | null;
  isArchived: boolean;
  createdAt: string;
}

export interface AccountWithBalance extends Account {
  balance: number;
}

export interface Category {
  id: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  fxRate: number;
  baseAmount: number;
  occurredOn: string;
  merchant: string;
  notes: string | null;
  transferAccountId: string | null;
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string;
  amount: number;
}

export interface TransactionInput {
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  fxRate: number;
  occurredOn: string;
  merchant: string;
  notes?: string | null;
  transferAccountId?: string | null;
}

export interface AccountInput {
  name: string;
  institution?: string | null;
  type: AccountType;
  currency: string;
  openingBalance: number;
  creditLimit?: number | null;
  color: string;
  icon: string;
  lastFour?: string | null;
}

export interface CategoryInput {
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
}

export interface BudgetInput {
  categoryId: string;
  month: string;
  amount: number;
}
