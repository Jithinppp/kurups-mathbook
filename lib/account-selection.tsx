"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useData } from "@/lib/data-context";
import { accountBalances } from "@/lib/finance";
import type { AccountWithBalance } from "@/lib/types";

interface AccountSelectionValue {
  activeAccounts: AccountWithBalance[];
  selectedAccount: AccountWithBalance | null;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
}

const AccountSelectionContext = createContext<AccountSelectionValue | null>(
  null,
);

/**
 * The workspace is account-first. Every page reads one selected bank, cash
 * source or credit card from this shared state, so switching accounts on the
 * overview also changes the activity and budget pages.
 */
export function AccountSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { accounts, transactions } = useData();
  const [preferredAccountId, setPreferredAccountId] = useState("");

  const activeAccounts = useMemo(
    () =>
      accountBalances(accounts, transactions).filter(
        (account) => !account.isArchived,
      ),
    [accounts, transactions],
  );

  const selectedAccount =
    activeAccounts.find((account) => account.id === preferredAccountId) ??
    activeAccounts[0] ??
    null;

  const setSelectedAccountId = useCallback((id: string) => {
    setPreferredAccountId(id);
  }, []);

  const value = useMemo(
    () => ({
      activeAccounts,
      selectedAccount,
      selectedAccountId: selectedAccount?.id ?? "",
      setSelectedAccountId,
    }),
    [activeAccounts, selectedAccount, setSelectedAccountId],
  );

  return (
    <AccountSelectionContext.Provider value={value}>
      {children}
    </AccountSelectionContext.Provider>
  );
}

export function useAccountSelection() {
  const context = useContext(AccountSelectionContext);
  if (!context) {
    throw new Error(
      "useAccountSelection must be used inside AccountSelectionProvider",
    );
  }
  return context;
}
