import { currentMonthKey } from "./dates";
import { seedDemoState, type DemoState } from "./demo-data";

// v3 scopes budgets to accounts. Bumping the key seeds the new account-first
// demo instead of leaving a returning visitor on the currency-first sample.
const STORAGE_KEY = "kurup.demo.v3";

export function loadDemoState(): DemoState {
  if (typeof window === "undefined") return seedDemoState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (
        parsed &&
        parsed.seededMonth === currentMonthKey() &&
        parsed.profile &&
        Array.isArray(parsed.accounts) &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.transactions) &&
        Array.isArray(parsed.budgets)
      ) {
        const currencyByAccount = new Map(
          parsed.accounts.map((account) => [account.id, account.currency]),
        );
        const accountByCurrency = new Map<string, string>();
        for (const account of parsed.accounts) {
          if (!accountByCurrency.has(account.currency)) {
            accountByCurrency.set(account.currency, account.id);
          }
        }
        return {
          ...parsed,
          profile: {
            id: parsed.profile.id,
            email: parsed.profile.email,
            fullName: parsed.profile.fullName,
            createdAt: parsed.profile.createdAt,
          },
          transactions: parsed.transactions.map((transaction) => ({
            ...transaction,
            currency:
              transaction.currency ||
              currencyByAccount.get(transaction.accountId) ||
              "AED",
          })),
          budgets: parsed.budgets.map((budget) => {
            const currency = budget.currency || "AED";
            return {
              ...budget,
              currency,
              accountId:
                budget.accountId ||
                accountByCurrency.get(currency) ||
                parsed.accounts[0]?.id ||
                "",
            };
          }),
        };
      }
    }
  } catch {
    // Corrupt local data should never block the demo.
  }

  const seeded = seedDemoState();
  saveDemoState(seeded);
  return seeded;
}

export function saveDemoState(state: DemoState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearDemoState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
