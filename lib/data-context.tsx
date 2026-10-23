"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import { currentMonthKey } from "./dates";
import { clearDemoState, loadDemoState, saveDemoState } from "./demo-store";
import { seedDemoState } from "./demo-data";
import { getSupabaseBrowserClient } from "./supabase/client";
import {
  accountPayload,
  mapAccount,
  mapBudget,
  mapCategory,
  mapProfile,
  mapTransaction,
  transactionPayload,
  type AccountRow,
  type BudgetDbRow,
  type CategoryRow,
  type ProfileRow,
  type TransactionRow,
} from "./supabase/mappers";
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
} from "./types";
import { uid } from "./utils";

function budgetWriteMessage(message: string) {
  const lower = message.toLowerCase();
  const missingSchema =
    lower.includes("account_id") ||
    lower.includes("currency") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("could not find") ||
    lower.includes("no unique") ||
    lower.includes("on_conflict") ||
    lower.includes("on conflict") ||
    lower.includes("exclusion constraint");

  if (missingSchema) {
    return "Budgets now belong to an account. Run the latest Supabase migrations (202610210001_native_currencies.sql and 202610220001_account_scoped_budgets.sql), then try again.";
  }

  return message;
}

interface DataState {
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

interface DataContextValue extends DataState {
  ready: boolean;
  error: string | null;
  refresh: () => void;
  addAccount: (input: AccountInput) => Promise<void>;
  updateAccount: (id: string, input: AccountInput) => Promise<void>;
  archiveAccount: (id: string) => Promise<void>;
  restoreAccount: (id: string) => Promise<void>;
  addTransaction: (input: TransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: TransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  setBudget: (input: BudgetInput) => Promise<void>;
  setBudgets: (month: string, inputs: BudgetInput[]) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<void>;
  updateCategory: (id: string, input: CategoryInput) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  resetDemo: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function fallbackProfile(name: string, email: string): Profile {
  return {
    id: "",
    email,
    fullName: name,
    createdAt: "",
  };
}

function emptyState(profile: Profile): DataState {
  return {
    profile,
    accounts: [],
    categories: [],
    transactions: [],
    budgets: [],
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<DataState>(() =>
    emptyState(fallbackProfile("", "")),
  );
  const { accounts } = state;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    const currentUser = user;

    async function load() {
      if (authLoading) return;

      if (!currentUser) {
        await Promise.resolve();
        if (cancelled) return;
        setState(emptyState(fallbackProfile("", "")));
        setReady(false);
        return;
      }

      setReady(false);
      setError(null);

      try {
        if (currentUser.isDemo) {
          const demo = loadDemoState();
          if (cancelled) return;
          setState({
            profile: demo.profile,
            accounts: demo.accounts,
            categories: demo.categories,
            transactions: demo.transactions,
            budgets: demo.budgets,
          });
          setReady(true);
          return;
        }

        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error("Supabase is not configured.");

        const [accountsResult, categoriesResult, budgetsResult, profileResult] =
          await Promise.all([
            supabase
              .from("accounts")
              .select("*")
              .eq("user_id", currentUser.id)
              .order("created_at", { ascending: true }),
            supabase
              .from("categories")
              .select("*")
              .eq("user_id", currentUser.id)
              .order("created_at", { ascending: true }),
            supabase
              .from("budgets")
              .select("*")
              .eq("user_id", currentUser.id)
              .order("month", { ascending: false }),
            supabase.from("profiles").select("*").eq("id", currentUser.id).maybeSingle(),
          ]);

        const firstError =
          accountsResult.error ??
          categoriesResult.error ??
          budgetsResult.error ??
          profileResult.error;
        if (firstError) throw new Error(firstError.message);

        // Load every transaction in pages. PostgREST caps a single response
        // (1000 rows by default), so a single query would quietly truncate
        // balances and history for active workspaces.
        const transactionRows: TransactionRow[] = [];
        const pageSize = 500;
        for (let from = 0; ; from += pageSize) {
          const { data: transactionData, error: transactionError } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("occurred_on", { ascending: false })
            .order("created_at", { ascending: false })
            .range(from, from + pageSize - 1);
          if (transactionError) throw new Error(transactionError.message);
          const page = (transactionData as TransactionRow[] | null) ?? [];
          transactionRows.push(...page);
          if (page.length < pageSize) break;
        }

        let profileRow = profileResult.data as ProfileRow | null;
        if (!profileRow) {
          const { data: created, error: createError } = await supabase
            .from("profiles")
            .upsert(
              {
                id: currentUser.id,
                email: currentUser.email,
                full_name: currentUser.name,
              },
              { onConflict: "id" },
            )
            .select("*")
            .single();
          if (createError) throw new Error(createError.message);
          profileRow = created as ProfileRow;
        }

        if (cancelled) return;

        setState({
          profile: mapProfile(profileRow),
          accounts: (accountsResult.data as AccountRow[]).map(mapAccount),
          categories: (categoriesResult.data as CategoryRow[]).map(mapCategory),
          transactions: transactionRows.map(mapTransaction),
          budgets: (budgetsResult.data as BudgetDbRow[]).map(mapBudget),
        });
        setReady(true);
      } catch (loadError) {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your workspace.",
        );
        setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, refreshKey]);

  const requireSupabase = useCallback(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    if (!user) throw new Error("You need to sign in first.");
    return { supabase, user };
  }, [user]);

  const addAccount = useCallback(
    async (input: AccountInput) => {
      if (user?.isDemo) {
        const account: Account = {
          ...input,
          id: uid(),
          institution: input.institution ?? null,
          creditLimit: input.creditLimit ?? null,
          lastFour: input.lastFour ?? null,
          isArchived: false,
          createdAt: new Date().toISOString(),
        };
        setState((current) => {
          const next = { ...current, accounts: [...current.accounts, account] };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: insertError } = await supabase
        .from("accounts")
        .insert({ ...accountPayload(input), user_id: currentUser.id })
        .select("*")
        .single();
      if (insertError) throw new Error(insertError.message);
      const account = mapAccount(data as AccountRow);
      setState((current) => ({
        ...current,
        accounts: [...current.accounts, account],
      }));
    },
    [user, requireSupabase],
  );

  const updateAccount = useCallback(
    async (id: string, input: AccountInput) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            accounts: current.accounts.map((account) =>
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
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: updateError } = await supabase
        .from("accounts")
        .update(accountPayload(input))
        .eq("id", id)
        .eq("user_id", currentUser.id)
        .select("*")
        .single();
      if (updateError) throw new Error(updateError.message);
      const updated = mapAccount(data as AccountRow);
      setState((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === id ? updated : account,
        ),
      }));
    },
    [user, requireSupabase],
  );

  const archiveAccount = useCallback(
    async (id: string) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            accounts: current.accounts.map((account) =>
              account.id === id ? { ...account, isArchived: true } : account,
            ),
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { error: archiveError } = await supabase
        .from("accounts")
        .update({ is_archived: true })
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (archiveError) throw new Error(archiveError.message);
      setState((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === id ? { ...account, isArchived: true } : account,
        ),
      }));
    },
    [user, requireSupabase],
  );

  const restoreAccount = useCallback(
    async (id: string) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            accounts: current.accounts.map((account) =>
              account.id === id ? { ...account, isArchived: false } : account,
            ),
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { error: restoreError } = await supabase
        .from("accounts")
        .update({ is_archived: false })
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (restoreError) throw new Error(restoreError.message);
      setState((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === id ? { ...account, isArchived: false } : account,
        ),
      }));
    },
    [user, requireSupabase],
  );

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      // The account owns the currency. Never trust a stale form value.
      const currency =
        accounts.find((account) => account.id === input.accountId)?.currency ??
        input.currency;
      const resolvedInput = { ...input, currency };

      if (user?.isDemo) {
        const now = new Date().toISOString();
        const transaction: Transaction = {
          ...resolvedInput,
          id: uid(),
          notes: input.notes ?? null,
          transferAccountId:
            input.type === "transfer" ? input.transferAccountId ?? null : null,
          createdAt: now,
        };
        setState((current) => {
          const next = {
            ...current,
            transactions: [transaction, ...current.transactions],
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: insertError } = await supabase
        .from("transactions")
        .insert({
          ...transactionPayload(resolvedInput),
          user_id: currentUser.id,
        })
        .select("*")
        .single();
      if (insertError) throw new Error(insertError.message);
      const transaction = mapTransaction(data as TransactionRow);
      setState((current) => ({
        ...current,
        transactions: [transaction, ...current.transactions],
      }));
    },
    [user, requireSupabase, accounts],
  );

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      const currency =
        accounts.find((account) => account.id === input.accountId)?.currency ??
        input.currency;
      const resolvedInput = { ...input, currency };

      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            transactions: current.transactions.map((transaction) =>
              transaction.id === id
                ? {
                    ...transaction,
                    ...resolvedInput,
                    notes: input.notes ?? null,
                    transferAccountId:
                      input.type === "transfer"
                        ? input.transferAccountId ?? null
                        : null,
                  }
                : transaction,
            ),
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: updateError } = await supabase
        .from("transactions")
        .update(transactionPayload(resolvedInput))
        .eq("id", id)
        .eq("user_id", currentUser.id)
        .select("*")
        .single();
      if (updateError) throw new Error(updateError.message);
      const updated = mapTransaction(data as TransactionRow);
      setState((current) => ({
        ...current,
        transactions: current.transactions.map((transaction) =>
          transaction.id === id ? updated : transaction,
        ),
      }));
    },
    [user, requireSupabase, accounts],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            transactions: current.transactions.filter(
              (transaction) => transaction.id !== id,
            ),
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { error: deleteError } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (deleteError) throw new Error(deleteError.message);
      setState((current) => ({
        ...current,
        transactions: current.transactions.filter(
          (transaction) => transaction.id !== id,
        ),
      }));
    },
    [user, requireSupabase],
  );

  const setBudget = useCallback(
    async (input: BudgetInput) => {
      const month = `${input.month.slice(0, 7)}-01`;
      if (user?.isDemo) {
        setState((current) => {
          const existing = current.budgets.find(
            (budget) =>
              budget.accountId === input.accountId &&
              budget.categoryId === input.categoryId &&
              budget.month === month,
          );
          const budgets = existing
            ? current.budgets.map((budget) =>
                budget.id === existing.id
                  ? {
                      ...budget,
                      amount: input.amount,
                      currency: input.currency,
                    }
                  : budget,
              )
            : [
                ...current.budgets,
                {
                  id: uid(),
                  accountId: input.accountId,
                  categoryId: input.categoryId,
                  month,
                  amount: input.amount,
                  currency: input.currency,
                },
              ];
          const next = { ...current, budgets };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: upsertError } = await supabase
        .from("budgets")
        .upsert(
          {
            user_id: currentUser.id,
            account_id: input.accountId,
            category_id: input.categoryId,
            month,
            amount: input.amount,
            currency: input.currency,
          },
          { onConflict: "user_id,account_id,category_id,month" },
        )
        .select("*")
        .single();
      if (upsertError) {
        throw new Error(budgetWriteMessage(upsertError.message));
      }
      const budget = mapBudget(data as BudgetDbRow);
      setState((current) => ({
        ...current,
        budgets: [
          ...current.budgets.filter(
            (item) =>
              !(
                item.accountId === budget.accountId &&
                item.categoryId === budget.categoryId &&
                item.month === budget.month
              ),
          ),
          budget,
        ],
      }));
    },
    [user, requireSupabase],
  );

  const setBudgets = useCallback(
    async (monthInput: string, inputs: BudgetInput[]) => {
      const month = `${monthInput.slice(0, 7)}-01`;
      if (inputs.length === 0) return;

      const keyFor = (accountId: string, categoryId: string) =>
        `${accountId}::${categoryId}`;

      if (user?.isDemo) {
        setState((current) => {
          const incoming = new Map(
            inputs.map((input) => [
              keyFor(input.accountId, input.categoryId),
              input.amount,
            ]),
          );
          const retained = current.budgets.filter(
            (budget) =>
              budget.month !== month ||
              !incoming.has(keyFor(budget.accountId, budget.categoryId)),
          );
          const replaced = inputs.map((input) => {
            const existing = current.budgets.find(
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
          const next = { ...current, budgets: [...retained, ...replaced] };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: upsertError } = await supabase
        .from("budgets")
        .upsert(
          inputs.map((input) => ({
            user_id: currentUser.id,
            account_id: input.accountId,
            category_id: input.categoryId,
            month,
            amount: input.amount,
            currency: input.currency,
          })),
          { onConflict: "user_id,account_id,category_id,month" },
        )
        .select("*");
      if (upsertError) {
        throw new Error(budgetWriteMessage(upsertError.message));
      }
      const updated = (data as BudgetDbRow[]).map(mapBudget);
      setState((current) => {
        const touched = new Set(
          updated.map((budget) => keyFor(budget.accountId, budget.categoryId)),
        );
        return {
          ...current,
          budgets: [
            ...current.budgets.filter(
              (budget) =>
                budget.month !== month ||
                !touched.has(keyFor(budget.accountId, budget.categoryId)),
            ),
            ...updated,
          ],
        };
      });
    },
    [user, requireSupabase],
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            budgets: current.budgets.filter((budget) => budget.id !== id),
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { error: deleteError } = await supabase
        .from("budgets")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (deleteError) throw new Error(deleteError.message);
      setState((current) => ({
        ...current,
        budgets: current.budgets.filter((budget) => budget.id !== id),
      }));
    },
    [user, requireSupabase],
  );

  const addCategory = useCallback(
    async (input: CategoryInput) => {
      if (user?.isDemo) {
        const category: Category = {
          ...input,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        setState((current) => {
          const next = {
            ...current,
            categories: [...current.categories, category],
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: insertError } = await supabase
        .from("categories")
        .insert({
          user_id: currentUser.id,
          name: input.name.trim(),
          kind: input.kind,
          icon: input.icon,
          color: input.color,
        })
        .select("*")
        .single();
      if (insertError) throw new Error(insertError.message);
      const category = mapCategory(data as CategoryRow);
      setState((current) => ({
        ...current,
        categories: [...current.categories, category],
      }));
    },
    [user, requireSupabase],
  );

  const updateCategory = useCallback(
    async (id: string, input: CategoryInput) => {
      const name = input.name.trim();

      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            categories: current.categories.map((category) =>
              category.id === id
                ? {
                    ...category,
                    name,
                    kind: input.kind,
                    icon: input.icon,
                    color: input.color,
                  }
                : category,
            ),
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { data, error: updateError } = await supabase
        .from("categories")
        .update({
          name,
          kind: input.kind,
          icon: input.icon,
          color: input.color,
        })
        .eq("id", id)
        .eq("user_id", currentUser.id)
        .select("*")
        .single();
      if (updateError) throw new Error(updateError.message);
      const category = mapCategory(data as CategoryRow);
      setState((current) => ({
        ...current,
        categories: current.categories.map((item) =>
          item.id === id ? category : item,
        ),
      }));
    },
    [user, requireSupabase],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            categories: current.categories.filter((category) => category.id !== id),
            transactions: current.transactions.map((transaction) =>
              transaction.categoryId === id
                ? { ...transaction, categoryId: null }
                : transaction,
            ),
            budgets: current.budgets.filter((budget) => budget.categoryId !== id),
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { error: deleteError } = await supabase
        .from("categories")
        .delete()
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (deleteError) throw new Error(deleteError.message);
      setState((current) => ({
        ...current,
        categories: current.categories.filter((category) => category.id !== id),
        transactions: current.transactions.map((transaction) =>
          transaction.categoryId === id
            ? { ...transaction, categoryId: null }
            : transaction,
        ),
        budgets: current.budgets.filter((budget) => budget.categoryId !== id),
      }));
    },
    [user, requireSupabase],
  );

  const updateProfile = useCallback(
    async (fullName: string) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            profile: { ...current.profile, fullName },
          };
          persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase, user: currentUser } = requireSupabase();
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", currentUser.id);
      if (updateError) throw new Error(updateError.message);
      setState((current) => ({
        ...current,
        profile: { ...current.profile, fullName },
      }));
    },
    [user, requireSupabase],
  );

  const resetDemo = useCallback(() => {
    clearDemoState();
    const demo = seedDemoState();
    saveDemoState(demo);
    setState({
      profile: demo.profile,
      accounts: demo.accounts,
      categories: demo.categories,
      transactions: demo.transactions,
      budgets: demo.budgets,
    });
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      ready,
      error,
      refresh,
      addAccount,
      updateAccount,
      archiveAccount,
      restoreAccount,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudget,
      setBudgets,
      deleteBudget,
      addCategory,
      updateCategory,
      deleteCategory,
      updateProfile,
      resetDemo,
    }),
    [
      state,
      ready,
      error,
      refresh,
      addAccount,
      updateAccount,
      archiveAccount,
      restoreAccount,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      setBudget,
      setBudgets,
      deleteBudget,
      addCategory,
      updateCategory,
      deleteCategory,
      updateProfile,
      resetDemo,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function persistDemo(state: DataState) {
  saveDemoState({ ...state, seededMonth: currentMonthKey() });
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used inside DataProvider");
  }
  return context;
}
