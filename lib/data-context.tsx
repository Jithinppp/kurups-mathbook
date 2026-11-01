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
import { useAuth } from "@/lib/auth-context";
import { seedDemoState } from "@/lib/demo-data";
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
import { SupabaseDataAdapter } from "@/lib/data/adapters/supabase";
import { DemoDataAdapter } from "@/lib/data/adapters/demo";

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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  // Pick the adapter based on auth mode. Demo uses localStorage; Supabase uses Postgres.
  const adapter = useMemo(() => {
    if (user?.isDemo) return new DemoDataAdapter();
    return new SupabaseDataAdapter();
  }, [user?.isDemo]);

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
        const loaded = await adapter.load();
        if (cancelled) return;
        if (!loaded) {
          setState(emptyState(fallbackProfile("", "")));
          setReady(false);
          return;
        }

        setState({
          profile: loaded.profile,
          accounts: loaded.accounts,
          categories: loaded.categories,
          transactions: loaded.transactions,
          budgets: loaded.budgets,
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
  }, [user, authLoading, adapter, refreshKey]);

  const refreshFromAdapter = useCallback(async () => {
    if (!user) return;
    const loaded = await adapter.load();
    if (!loaded) return;
    setState({
      profile: loaded.profile,
      accounts: loaded.accounts,
      categories: loaded.categories,
      transactions: loaded.transactions,
      budgets: loaded.budgets,
    });
  }, [user, adapter]);

  const addAccount = useCallback(
    async (input: AccountInput) => {
      await adapter.addAccount(input);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const updateAccount = useCallback(
    async (id: string, input: AccountInput) => {
      await adapter.updateAccount(id, input);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const archiveAccount = useCallback(
    async (id: string) => {
      await adapter.archiveAccount(id);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const restoreAccount = useCallback(
    async (id: string) => {
      await adapter.restoreAccount(id);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      await adapter.addTransaction(input);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const updateTransaction = useCallback(
    async (id: string, input: TransactionInput) => {
      await adapter.updateTransaction(id, input);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await adapter.deleteTransaction(id);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const setBudget = useCallback(
    async (input: BudgetInput) => {
      await adapter.setBudget(input);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const setBudgets = useCallback(
    async (month: string, inputs: BudgetInput[]) => {
      await adapter.setBudgets(month, inputs);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      await adapter.deleteBudget(id);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const addCategory = useCallback(
    async (input: CategoryInput) => {
      await adapter.addCategory(input);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const updateCategory = useCallback(
    async (id: string, input: CategoryInput) => {
      await adapter.updateCategory(id, input);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      await adapter.deleteCategory(id);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const updateProfile = useCallback(
    async (fullName: string) => {
      await adapter.updateProfile(fullName);
      await refreshFromAdapter();
    },
    [adapter, refreshFromAdapter],
  );

  const resetDemo = useCallback(() => {
    if (!(adapter instanceof DemoDataAdapter)) return;
    adapter.reset();
    const demo = seedDemoState();
    setState({
      profile: demo.profile,
      accounts: demo.accounts,
      categories: demo.categories,
      transactions: demo.transactions,
      budgets: demo.budgets,
    });
    setReady(true);
  }, [adapter]);

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

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used inside DataProvider");
  }
  return context;
}
