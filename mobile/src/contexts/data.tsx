import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  accountPayload,
  currentMonthKey,
  mapAccount,
  mapBudget,
  mapCategory,
  mapProfile,
  mapTransaction,
  seedDemoState,
  transactionPayload,
  uid,
  type Account,
  type AccountInput,
  type AccountRow,
  type Budget,
  type BudgetInput,
  type BudgetDbRow,
  type Category,
  type CategoryInput,
  type CategoryRow,
  type Profile,
  type ProfileRow,
  type Transaction,
  type TransactionInput,
  type TransactionRow,
} from "@asharibook/shared";

import { useAuth } from "./auth";
import {
  clearDemoState,
  loadCachedWorkspace,
  loadDemoState,
  saveCachedWorkspace,
  saveDemoState,
} from "@/lib/storage";
import { supabase } from "@/lib/supabase";

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
    lower.includes("on conflict");

  if (missingSchema) {
    return "Budgets now belong to an account. Run the latest Supabase migrations, then try again.";
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
  addAccount: (input: AccountInput) => Promise<Account>;
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
  resetDemo: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

function fallbackProfile(name: string, email: string): Profile {
  return { id: "", email, fullName: name, createdAt: "" };
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
        if (cancelled) return;
        setState(emptyState(fallbackProfile("", "")));
        setReady(false);
        return;
      }

      setError(null);

      if (currentUser.isDemo) {
        const demo = await loadDemoState();
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

      const cached = await loadCachedWorkspace(currentUser.id);
      if (cached && !cancelled) {
        setState({
          profile: cached.profile,
          accounts: cached.accounts,
          categories: cached.categories,
          transactions: cached.transactions,
          budgets: cached.budgets,
        });
        setReady(true);
      } else {
        setReady(false);
      }

      try {
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
            supabase
              .from("profiles")
              .select("*")
              .eq("id", currentUser.id)
              .maybeSingle(),
          ]);

        const firstError =
          accountsResult.error ?? categoriesResult.error ?? profileResult.error;
        if (firstError) throw new Error(firstError.message);

        // Budgets require the account-scoped migration. Keep the rest of the
        // workspace usable on an older live schema and surface a clear hint.
        const budgetLoadError = budgetsResult.error;
        const loadedBudgetRows = (budgetsResult.data as BudgetDbRow[] | null) ?? [];
        const budgetsNeedMigration = loadedBudgetRows.some(
          (row) => !(row as { account_id?: string }).account_id,
        );

        const transactionRows: TransactionRow[] = [];
        const pageSize = 500;
        for (let from = 0; ; from += pageSize) {
          const { data, error: transactionError } = await supabase
            .from("transactions")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("occurred_on", { ascending: false })
            .order("created_at", { ascending: false })
            .range(from, from + pageSize - 1);
          if (transactionError) throw new Error(transactionError.message);
          const page = (data as TransactionRow[] | null) ?? [];
          transactionRows.push(...page);
          if (page.length < pageSize) break;
        }

        let profileRow = profileResult.data as ProfileRow | null;
        if (!profileRow) {
          const { data, error: createError } = await supabase
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
          profileRow = data as ProfileRow;
        }

        if (cancelled) return;

        const next = {
          profile: mapProfile(profileRow),
          accounts: (accountsResult.data as AccountRow[]).map(mapAccount),
          categories: (categoriesResult.data as CategoryRow[]).map(mapCategory),
          transactions: transactionRows.map(mapTransaction),
          budgets: budgetsNeedMigration ? [] : loadedBudgetRows.map(mapBudget),
        };
        setState(next);
        setReady(true);
        if (budgetLoadError) {
          setError(budgetWriteMessage(budgetLoadError.message));
        } else if (budgetsNeedMigration) {
          setError(
            "Budgets now belong to an account. Run the latest Supabase migrations, then refresh.",
          );
        }
        await saveCachedWorkspace(currentUser.id, next);
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
          void persistDemo(next);
          return next;
        });
        return account;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: insertError } = await client
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
      return account;
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: updateError } = await client
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

  const setArchived = useCallback(
    async (id: string, archived: boolean) => {
      if (user?.isDemo) {
        setState((current) => {
          const next = {
            ...current,
            accounts: current.accounts.map((account) =>
              account.id === id ? { ...account, isArchived: archived } : account,
            ),
          };
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { error: updateError } = await client
        .from("accounts")
        .update({ is_archived: archived })
        .eq("id", id)
        .eq("user_id", currentUser.id);
      if (updateError) throw new Error(updateError.message);
      setState((current) => ({
        ...current,
        accounts: current.accounts.map((account) =>
          account.id === id ? { ...account, isArchived: archived } : account,
        ),
      }));
    },
    [user, requireSupabase],
  );

  const archiveAccount = useCallback(
    (id: string) => setArchived(id, true),
    [setArchived],
  );
  const restoreAccount = useCallback(
    (id: string) => setArchived(id, false),
    [setArchived],
  );

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      const currency =
        accounts.find((account) => account.id === input.accountId)?.currency ??
        input.currency;
      const resolvedInput = { ...input, currency };

      if (user?.isDemo) {
        const transaction: Transaction = {
          ...resolvedInput,
          id: uid(),
          notes: input.notes ?? null,
          transferAccountId:
            input.type === "transfer" ? input.transferAccountId ?? null : null,
          createdAt: new Date().toISOString(),
        };
        setState((current) => {
          const next = {
            ...current,
            transactions: [transaction, ...current.transactions],
          };
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: insertError } = await client
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: updateError } = await client
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { error: deleteError } = await client
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
                  ? { ...budget, amount: input.amount, currency: input.currency }
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: upsertError } = await client
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
      if (upsertError) throw new Error(budgetWriteMessage(upsertError.message));
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: upsertError } = await client
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
      if (upsertError) throw new Error(budgetWriteMessage(upsertError.message));
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { error: deleteError } = await client
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: insertError } = await client
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { data, error: updateError } = await client
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { error: deleteError } = await client
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
          void persistDemo(next);
          return next;
        });
        return;
      }

      const { supabase: client, user: currentUser } = requireSupabase();
      const { error: updateError } = await client
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

  const resetDemo = useCallback(async () => {
    await clearDemoState();
    const demo = seedDemoState();
    await saveDemoState(demo);
    setState({
      profile: demo.profile,
      accounts: demo.accounts,
      categories: demo.categories,
      transactions: demo.transactions,
      budgets: demo.budgets,
    });
  }, []);

  const value = useMemo<DataContextValue>(
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

async function persistDemo(state: DataState) {
  await saveDemoState({ ...state, seededMonth: currentMonthKey() });
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used inside DataProvider");
  return context;
}
