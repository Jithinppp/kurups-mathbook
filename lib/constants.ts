import type { CategoryInput } from "./types";

export const BASE_CURRENCY = "AED";

export const CURRENCIES = [
  { code: "AED", label: "UAE Dirham", rateToAed: 1 },
  { code: "INR", label: "Indian Rupee", rateToAed: 0.0426 },
  { code: "USD", label: "US Dollar", rateToAed: 3.6725 },
  { code: "EUR", label: "Euro", rateToAed: 3.99 },
  { code: "GBP", label: "British Pound", rateToAed: 4.65 },
] as const;

export function rateForCurrency(currency: string) {
  return CURRENCIES.find((item) => item.code === currency)?.rateToAed ?? 1;
}

export const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  bank: "Bank account",
  cash: "Cash",
  credit_card: "Credit card",
};

export const CATEGORY_SEED: CategoryInput[] = [
  { name: "Groceries", kind: "expense", icon: "shopping-cart", color: "#7132f5" },
  { name: "Dining", kind: "expense", icon: "utensils", color: "#5b1ecf" },
  { name: "Transport", kind: "expense", icon: "car", color: "#101114" },
  { name: "Shopping", kind: "expense", icon: "shopping-bag", color: "#b45309" },
  { name: "Utilities", kind: "expense", icon: "zap", color: "#0e7490" },
  { name: "Rent", kind: "expense", icon: "home", color: "#5741d8" },
  { name: "Family", kind: "expense", icon: "users", color: "#c2410c" },
  { name: "Education", kind: "expense", icon: "graduation-cap", color: "#0891b2" },
  { name: "Health", kind: "expense", icon: "heart-pulse", color: "#be123c" },
  { name: "Entertainment", kind: "expense", icon: "clapperboard", color: "#149e61" },
  { name: "Travel", kind: "expense", icon: "plane", color: "#2563eb" },
  { name: "Subscriptions", kind: "expense", icon: "repeat", color: "#686b82" },
  { name: "Fees", kind: "expense", icon: "file-text", color: "#52525b" },
  { name: "Other", kind: "expense", icon: "more-horizontal", color: "#9497a9" },
  { name: "Salary", kind: "income", icon: "briefcase", color: "#149e61" },
  { name: "Freelance", kind: "income", icon: "wallet", color: "#0e7490" },
  { name: "Refund", kind: "income", icon: "undo-2", color: "#7132f5" },
  { name: "Other income", kind: "income", icon: "gift", color: "#686b82" },
];

export const SUGGESTED_BUDGETS: Record<string, number> = {
  Rent: 5200,
  Groceries: 900,
  Dining: 700,
  Transport: 400,
  Shopping: 800,
  Utilities: 600,
  Entertainment: 300,
  Health: 400,
  Family: 2500,
  Education: 1200,
  Subscriptions: 100,
};

export const ACCOUNT_COLORS = [
  "#7132f5",
  "#101114",
  "#149e61",
  "#5b1ecf",
  "#0e7490",
  "#b45309",
  "#be123c",
  "#686b82",
];

export const CARD_COLORS = ["#7132f5", "#101114", "#5b1ecf", "#149e61", "#0e7490"];
