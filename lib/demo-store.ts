import { currentMonthKey } from "./dates";
import { seedDemoState, type DemoState } from "./demo-data";

const STORAGE_KEY = "kurup.demo.v1";

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
        return parsed;
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
