import { describe, expect, it, beforeEach } from "vitest";
import { DemoDataAdapter } from "@/lib/data/adapters/demo";
import type { AccountInput, TransactionInput } from "@/lib/types";

describe("DemoDataAdapter", () => {
  let adapter: DemoDataAdapter;

  beforeEach(() => {
    adapter = new DemoDataAdapter();
    (globalThis.window as { localStorage: Storage }).localStorage.clear();
  });

  it("loads seeded state on first load", async () => {
    const state = await adapter.load();
    expect(state).not.toBeNull();
    expect(state!.profile.id).toBe("demo-user");
    expect(state!.accounts.length).toBeGreaterThan(0);
    expect(state!.categories.length).toBeGreaterThan(0);
    expect(state!.transactions.length).toBeGreaterThan(0);
    expect(state!.budgets.length).toBeGreaterThan(0);
  });

  it("adds an account", async () => {
    await adapter.load();
    await adapter.addAccount({
      name: "Test Account",
      type: "bank",
      currency: "AED",
      openingBalance: 1000,
      color: "#7132f5",
      icon: "wallet",
    });
    const state = await adapter.load();
    const testAccount = state!.accounts.find((a) => a.name === "Test Account");
    expect(testAccount).toBeDefined();
    expect(testAccount!.currency).toBe("AED");
    expect(testAccount!.isArchived).toBe(false);
  });

  it("updates an account", async () => {
    await adapter.load();
    const state = await adapter.load();
    const account = state!.accounts[0];
    await adapter.updateAccount(account.id, {
      name: "Renamed Account",
      type: account.type,
      currency: account.currency,
      openingBalance: account.openingBalance,
      color: account.color,
      icon: account.icon,
    } as AccountInput);
    const updated = await adapter.load();
    const renamed = updated!.accounts.find((a) => a.id === account.id);
    expect(renamed!.name).toBe("Renamed Account");
  });

  it("archives and restores an account", async () => {
    await adapter.load();
    const state = await adapter.load();
    const account = state!.accounts.find((a) => !a.isArchived)!;
    await adapter.archiveAccount(account.id);
    let updated = await adapter.load();
    expect(updated!.accounts.find((a) => a.id === account.id)!.isArchived).toBe(
      true,
    );
    await adapter.restoreAccount(account.id);
    updated = await adapter.load();
    expect(updated!.accounts.find((a) => a.id === account.id)!.isArchived).toBe(
      false,
    );
  });

  it("adds a transaction", async () => {
    await adapter.load();
    const state = await adapter.load();
    const account = state!.accounts[0];
    await adapter.addTransaction({
      accountId: account.id,
      categoryId: null,
      type: "expense",
      amount: 500,
      currency: account.currency,
      occurredOn: "2026-11-01",
      merchant: "Test Merchant",
      notes: "Test notes",
    });
    const updated = await adapter.load();
    const tx = updated!.transactions.find((t) => t.merchant === "Test Merchant");
    expect(tx).toBeDefined();
    expect(tx!.amount).toBe(500);
  });

  it("updates a transaction", async () => {
    await adapter.load();
    const state = await adapter.load();
    const tx = state!.transactions[0];
    await adapter.updateTransaction(tx.id, {
      ...tx,
      amount: 999,
    } as TransactionInput);
    const updated = await adapter.load();
    const updatedTx = updated!.transactions.find((t) => t.id === tx.id);
    expect(updatedTx!.amount).toBe(999);
  });

  it("deletes a transaction", async () => {
    await adapter.load();
    const state = await adapter.load();
    const tx = state!.transactions[0];
    const beforeCount = state!.transactions.length;
    await adapter.deleteTransaction(tx.id);
    const updated = await adapter.load();
    expect(updated!.transactions.length).toBe(beforeCount - 1);
    expect(
      updated!.transactions.find((t) => t.id === tx.id),
    ).toBeUndefined();
  });

  it("sets a budget", async () => {
    await adapter.load();
    const state = await adapter.load();
    const account = state!.accounts[0];
    const category = state!.categories.find((c) => c.kind === "expense")!;
    await adapter.setBudget({
      accountId: account.id,
      categoryId: category.id,
      month: "2026-11",
      amount: 1000,
      currency: account.currency,
    });
    const updated = await adapter.load();
    const budget = updated!.budgets.find(
      (b) => b.categoryId === category.id && b.month === "2026-11-01",
    );
    expect(budget).toBeDefined();
    expect(budget!.amount).toBe(1000);
  });

  it("sets multiple budgets at once", async () => {
    await adapter.load();
    const state = await adapter.load();
    const account = state!.accounts[0];
    const categories = state!.categories.filter((c) => c.kind === "expense");
    const inputs = categories.slice(0, 3).map((c) => ({
      accountId: account.id,
      categoryId: c.id,
      month: "2026-11",
      amount: 500,
      currency: account.currency,
    }));
    await adapter.setBudgets("2026-11", inputs);
    const updated = await adapter.load();
    // Each input budget should be present with the correct amount.
    for (const input of inputs) {
      const budget = updated!.budgets.find(
        (b) =>
          b.accountId === input.accountId &&
          b.categoryId === input.categoryId &&
          b.month === "2026-11-01",
      );
      expect(budget).toBeDefined();
      expect(budget!.amount).toBe(500);
    }
  });

  it("deletes a budget", async () => {
    await adapter.load();
    const state = await adapter.load();
    const budget = state!.budgets[0];
    await adapter.deleteBudget(budget.id);
    const updated = await adapter.load();
    expect(
      updated!.budgets.find((b) => b.id === budget.id),
    ).toBeUndefined();
  });

  it("adds, updates, and deletes a category", async () => {
    await adapter.load();
    await adapter.addCategory({
      name: "Test Category",
      kind: "expense",
      icon: "shopping-cart",
      color: "#7132f5",
    });
    let state = await adapter.load();
    const category = state!.categories.find((c) => c.name === "Test Category");
    expect(category).toBeDefined();

    await adapter.updateCategory(category!.id, {
      name: "Updated Category",
      kind: "expense",
      icon: "shopping-bag",
      color: "#5b1ecf",
    });
    state = await adapter.load();
    const updated = state!.categories.find((c) => c.id === category!.id);
    expect(updated!.name).toBe("Updated Category");

    await adapter.deleteCategory(updated!.id);
    state = await adapter.load();
    expect(state!.categories.find((c) => c.id === updated!.id)).toBeUndefined();
  });

  it("updates profile", async () => {
    await adapter.load();
    await adapter.updateProfile("New Name");
    const state = await adapter.load();
    expect(state!.profile.fullName).toBe("New Name");
  });

  it("resets demo state", async () => {
    await adapter.load();
    // Make a change
    await adapter.addAccount({
      name: "Temp Account",
      type: "cash",
      currency: "AED",
      openingBalance: 0,
      color: "#7132f5",
      icon: "wallet",
    });
    // Reset
    adapter.reset();
    const state = await adapter.load();
    const tempAccount = state!.accounts.find((a) => a.name === "Temp Account");
    expect(tempAccount).toBeUndefined();
  });
});
