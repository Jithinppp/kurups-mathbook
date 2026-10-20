"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import type { Transaction } from "@/lib/types";

interface QuickAddContextValue {
  openTransaction: (transaction?: Transaction | null) => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const value = useMemo(
    () => ({
      openTransaction: (transaction?: Transaction | null) => {
        setEditing(transaction ?? null);
        setOpen(true);
      },
    }),
    [],
  );

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <TransactionDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
      />
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) throw new Error("useQuickAdd must be used inside QuickAddProvider");
  return context;
}
