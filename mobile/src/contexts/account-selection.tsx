import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { accountBalances, type AccountWithBalance } from "@asharibook/shared";

import { useData } from "./data";
import { SELECTED_ACCOUNT_KEY } from "@/lib/storage";

interface AccountSelectionValue {
  activeAccounts: AccountWithBalance[];
  selectedAccount: AccountWithBalance | null;
  selectedAccountId: string;
  setSelectedAccountId: (id: string) => void;
}

const AccountSelectionContext = createContext<AccountSelectionValue | null>(null);

export function AccountSelectionProvider({ children }: { children: ReactNode }) {
  const { accounts, transactions } = useData();
  const [preferredAccountId, setPreferredAccountId] = useState("");

  useEffect(() => {
    void AsyncStorage.getItem(SELECTED_ACCOUNT_KEY).then((id) => {
      if (id) setPreferredAccountId(id);
    });
  }, []);

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
    void AsyncStorage.setItem(SELECTED_ACCOUNT_KEY, id);
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
