import type { CategoryInput } from "./types";

/**
 * A practical list of currencies people actually hold accounts in. The studio
 * never converts between them; this list only decides which native currency an
 * account can be created with. AED and INR stay first because they are the
 * primary currencies in the sample workspace.
 */
export const CURRENCIES = [
  { code: "AED", label: "UAE Dirham" },
  { code: "INR", label: "Indian Rupee" },
  { code: "USD", label: "US Dollar" },
  { code: "EUR", label: "Euro" },
  { code: "GBP", label: "British Pound" },
  { code: "SAR", label: "Saudi Riyal" },
  { code: "QAR", label: "Qatari Riyal" },
  { code: "KWD", label: "Kuwaiti Dinar" },
  { code: "OMR", label: "Omani Rial" },
  { code: "BHD", label: "Bahraini Dinar" },
  { code: "PKR", label: "Pakistani Rupee" },
  { code: "BDT", label: "Bangladeshi Taka" },
  { code: "LKR", label: "Sri Lankan Rupee" },
  { code: "NPR", label: "Nepalese Rupee" },
  { code: "PHP", label: "Philippine Peso" },
  { code: "CNY", label: "Chinese Yuan" },
  { code: "JPY", label: "Japanese Yen" },
  { code: "KRW", label: "South Korean Won" },
  { code: "SGD", label: "Singapore Dollar" },
  { code: "MYR", label: "Malaysian Ringgit" },
  { code: "THB", label: "Thai Baht" },
  { code: "IDR", label: "Indonesian Rupiah" },
  { code: "VND", label: "Vietnamese Dong" },
  { code: "TRY", label: "Turkish Lira" },
  { code: "EGP", label: "Egyptian Pound" },
  { code: "ZAR", label: "South African Rand" },
  { code: "CAD", label: "Canadian Dollar" },
  { code: "AUD", label: "Australian Dollar" },
  { code: "NZD", label: "New Zealand Dollar" },
  { code: "CHF", label: "Swiss Franc" },
  { code: "HKD", label: "Hong Kong Dollar" },
  { code: "SEK", label: "Swedish Krona" },
  { code: "NOK", label: "Norwegian Krone" },
  { code: "DKK", label: "Danish Krone" },
  { code: "PLN", label: "Polish Zloty" },
  { code: "BRL", label: "Brazilian Real" },
  { code: "MXN", label: "Mexican Peso" },
  { code: "NGN", label: "Nigerian Naira" },
  { code: "KES", label: "Kenyan Shilling" },
  { code: "ILS", label: "Israeli New Shekel" },
  { code: "JOD", label: "Jordanian Dinar" },
  { code: "TWD", label: "New Taiwan Dollar" },
] as const;

export function currencyRank(currency: string) {
  const index = CURRENCIES.findIndex((item) => item.code === currency);
  return index === -1 ? CURRENCIES.length : index;
}

export function sortCurrencies(values: Iterable<string>) {
  return Array.from(new Set(values)).sort(
    (a, b) => currencyRank(a) - currencyRank(b) || a.localeCompare(b),
  );
}

export function currencyLabel(currency: string) {
  return (
    CURRENCIES.find((item) => item.code === currency)?.label ?? currency
  );
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

/**
 * Starter budgets are native amounts for each currency. They are never
 * converted from another currency.
 */
export const SUGGESTED_BUDGETS: Record<string, Record<string, number>> = {
  AED: {
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
  },
  INR: {
    Rent: 18000,
    Groceries: 7000,
    Dining: 5000,
    Transport: 3000,
    Shopping: 6000,
    Utilities: 3500,
    Entertainment: 2500,
    Health: 3000,
    Family: 10000,
    Education: 8000,
    Subscriptions: 800,
  },
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
