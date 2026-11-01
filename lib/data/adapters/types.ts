import type {
  Account,
  AccountInput,
  Budget,
  BudgetInput,
  Category,
  CategoryInput,
  Profile,
  Transaction,
  TransactionInput,
} from "@/lib/types";

export interface DataAdapter {
  load(): Promise<{
    profile: Profile;
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    budgets: Budget[];
  } | null>;
  addAccount(input: AccountInput): Promise<void>;
  updateAccount(id: string, input: AccountInput): Promise<void>;
  archiveAccount(id: string): Promise<void>;
  restoreAccount(id: string): Promise<void>;
  addTransaction(input: TransactionInput): Promise<void>;
  updateTransaction(id: string, input: TransactionInput): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  setBudget(input: BudgetInput): Promise<void>;
  setBudgets(month: string, inputs: BudgetInput[]): Promise<void>;
  deleteBudget(id: string): Promise<void>;
  addCategory(input: CategoryInput): Promise<void>;
  updateCategory(id: string, input: CategoryInput): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  updateProfile(fullName: string): Promise<void>;
}
