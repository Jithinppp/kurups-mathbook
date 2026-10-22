import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  currentMonthKey,
  seedDemoState,
  type Account,
  type AppUser,
  type Budget,
  type Category,
  type DemoState,
  type Profile,
  type Transaction,
} from "@asharibook/shared";

export const DEMO_USER_KEY = "asharibook.demo.user";
export const DEMO_STATE_KEY = "asharibook.demo.v3";
export const SELECTED_ACCOUNT_KEY = "asharibook.selected.account";
const CACHE_PREFIX = "asharibook.cache.";

export const DEMO_USER: AppUser = {
  id: "demo-user",
  email: "jithin@asharibook.app",
  name: "Jithin",
  isDemo: true,
};

export interface CachedWorkspace {
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  cachedAt: string;
}

export async function loadDemoUser() {
  const raw = await AsyncStorage.getItem(DEMO_USER_KEY);
  return raw ? (JSON.parse(raw) as AppUser) : null;
}

export async function saveDemoUser(user: AppUser) {
  await AsyncStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
}

export async function clearDemoUser() {
  await AsyncStorage.removeItem(DEMO_USER_KEY);
}

export async function loadDemoState(): Promise<DemoState> {
  const raw = await AsyncStorage.getItem(DEMO_STATE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as DemoState;
      if (
        parsed?.seededMonth === currentMonthKey() &&
        parsed.profile &&
        Array.isArray(parsed.accounts) &&
        Array.isArray(parsed.categories) &&
        Array.isArray(parsed.transactions) &&
        Array.isArray(parsed.budgets)
      ) {
        return parsed;
      }
    } catch {
      // fall through and reseed
    }
  }
  const seeded = seedDemoState();
  await saveDemoState(seeded);
  return seeded;
}

export async function saveDemoState(state: DemoState) {
  await AsyncStorage.setItem(
    DEMO_STATE_KEY,
    JSON.stringify({ ...state, seededMonth: currentMonthKey() }),
  );
}

export async function clearDemoState() {
  await AsyncStorage.removeItem(DEMO_STATE_KEY);
}

export async function loadCachedWorkspace(userId: string) {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${userId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CachedWorkspace;
  } catch {
    return null;
  }
}

export async function saveCachedWorkspace(
  userId: string,
  workspace: Omit<CachedWorkspace, "cachedAt">,
) {
  await AsyncStorage.setItem(
    `${CACHE_PREFIX}${userId}`,
    JSON.stringify({ ...workspace, cachedAt: new Date().toISOString() }),
  );
}

export async function clearCachedWorkspace(userId: string) {
  await AsyncStorage.removeItem(`${CACHE_PREFIX}${userId}`);
}
