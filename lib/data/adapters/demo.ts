import { currentMonthKey } from "@/lib/dates";
import { clearDemoState, loadDemoState, saveDemoState } from "@/lib/demo-store";
import { seedDemoState } from "@/lib/demo-data";
import { uid } from "@/lib/utils";
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
import type { DataAdapter } from "./types";

export class DemoDataAdapter implements DataAdapter {
  private state: {
    profile: Profile;
    accounts: Account[];
    categories: Category[];
    transactions: Transaction[];
    budgets: Budget[];
  } | null = null;

  private ensureLoaded() {
    if (!this.state) {
      this.state = loadDemoState();
    }
    return this.state!;
  }

  private persist() {
    if (!this.state) return;
    saveDemoState({ ...this.state, seededMonth: currentMonthKey() });
  }

  async load() {
    this.state = loadDemoState();
    return this.state;
  }

  async addAccount(input: AccountInput) {
    const state = this.ensureLoaded();
    const account: Account = {
      ...input,
      id: uid(),
      institution: input.institution ?? null,
      creditLimit: input.creditLimit ?? null,
      lastFour: input.lastFour ?? null,
      isArchived: false,
      createdAt: new Date().toISOString(),
    };
    this.state = {
      ...state,
      accounts: [...state.accounts, account],
    };
    this.persist();
  }

  async updateAccount(id: string, input: AccountInput) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      accounts: state.accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              ...input,
              institution: input.institution ?? null,
              creditLimit: input.creditLimit ?? null,
              lastFour: input.lastFour ?? null,
            }
          : account,
      ),
    };
    this.persist();
  }

  async archiveAccount(id: string) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, isArchived: true } : account,
      ),
    };
    this.persist();
  }

  async restoreAccount(id: string) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      accounts: state.accounts.map((account) =>
        account.id === id ? { ...account, isArchived: false } : account,
      ),
    };
    this.persist();
  }

  async addTransaction(input: TransactionInput) {
    const state = this.ensureLoaded();
    const now = new Date().toISOString();
    const transaction: Transaction = {
      ...input,
      id: uid(),
      notes: input.notes ?? null,
      transferAccountId:
        input.type === "transfer" ? input.transferAccountId ?? null : null,
      createdAt: now,
    };
    this.state = {
      ...state,
      transactions: [transaction, ...state.transactions],
    };
    this.persist();
  }

  async updateTransaction(id: string, input: TransactionInput) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      transactions: state.transactions.map((transaction) =>
        transaction.id === id
          ? {
              ...transaction,
              ...input,
              notes: input.notes ?? null,
              transferAccountId:
                input.type === "transfer"
                  ? input.transferAccountId ?? null
                  : null,
            }
          : transaction,
      ),
    };
    this.persist();
  }

  async deleteTransaction(id: string) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      transactions: state.transactions.filter(
        (transaction) => transaction.id !== id,
      ),
    };
    this.persist();
  }

  async setBudget(input: BudgetInput) {
    const state = this.ensureLoaded();
    const month = `${input.month.slice(0, 7)}-01`;
    const existing = state.budgets.find(
      (budget) =>
        budget.accountId === input.accountId &&
        budget.categoryId === input.categoryId &&
        budget.month === month,
    );
    const budgets = existing
      ? state.budgets.map((budget) =>
          budget.id === existing.id
            ? { ...budget, amount: input.amount, currency: input.currency }
            : budget,
        )
      : [
          ...state.budgets,
          {
            id: uid(),
            accountId: input.accountId,
            categoryId: input.categoryId,
            month,
            amount: input.amount,
            currency: input.currency,
          },
        ];
    this.state = { ...state, budgets };
    this.persist();
  }

  async setBudgets(monthInput: string, inputs: BudgetInput[]) {
    const state = this.ensureLoaded();
    const month = `${monthInput.slice(0, 7)}-01`;
    if (inputs.length === 0) return;

    const keyFor = (accountId: string, categoryId: string) =>
      `${accountId}::${categoryId}`;

    const incoming = new Map(
      inputs.map((input) => [keyFor(input.accountId, input.categoryId), input.amount]),
    );
    const retained = state.budgets.filter(
      (budget) =>
        budget.month !== month || !incoming.has(keyFor(budget.accountId, budget.categoryId)),
    );
    const replaced = inputs.map((input) => {
      const existing = state.budgets.find(
        (budget) =>
          budget.month === month &&
          budget.accountId === input.accountId &&
          budget.categoryId === input.categoryId,
      );
      return {
        id: existing?.id ?? uid(),
        accountId: input.accountId,
        categoryId: input.categoryId,
        month,
        amount: input.amount,
        currency: input.currency,
      };
    });
    this.state = { ...state, budgets: [...retained, ...replaced] };
    this.persist();
  }

  async deleteBudget(id: string) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      budgets: state.budgets.filter((budget) => budget.id !== id),
    };
    this.persist();
  }

  async addCategory(input: CategoryInput) {
    const state = this.ensureLoaded();
    const category: Category = {
      ...input,
      id: uid(),
      createdAt: new Date().toISOString(),
    };
    this.state = {
      ...state,
      categories: [...state.categories, category],
    };
    this.persist();
  }

  async updateCategory(id: string, input: CategoryInput) {
    const state = this.ensureLoaded();
    const name = input.name.trim();
    this.state = {
      ...state,
      categories: state.categories.map((category) =>
        category.id === id
          ? { ...category, name, kind: input.kind, icon: input.icon, color: input.color }
          : category,
      ),
    };
    this.persist();
  }

  async deleteCategory(id: string) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      categories: state.categories.filter((category) => category.id !== id),
      transactions: state.transactions.map((transaction) =>
        transaction.categoryId === id
          ? { ...transaction, categoryId: null }
          : transaction,
      ),
      budgets: state.budgets.filter((budget) => budget.categoryId !== id),
    };
    this.persist();
  }

  async updateProfile(fullName: string) {
    const state = this.ensureLoaded();
    this.state = {
      ...state,
      profile: { ...state.profile, fullName },
    };
    this.persist();
  }

  reset() {
    clearDemoState();
    const demo = seedDemoState();
    saveDemoState(demo);
    this.state = demo;
  }
}
