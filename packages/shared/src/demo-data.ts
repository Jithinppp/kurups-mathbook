import { CATEGORY_SEED, SUGGESTED_BUDGETS } from "./constants";
import { currentMonthKey, dayOfMonth, monthRange, monthStart, todayISO } from "./dates";
import type { Account, Budget, Category, Profile, Transaction } from "./types";
import { roundMoney } from "./utils";

export interface DemoState {
  seededMonth: string;
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
}

const DESIRED_BALANCE: Record<string, number> = {
  "acc-enbd": 27450.5,
  "acc-savings": 12000,
  "acc-cash": 1150,
  "acc-fab": -3280.75,
  "acc-mashreq-card": -1840.2,
  "acc-hdfc": 184500,
  "acc-hdfc-card": -28450,
};

const ACCOUNT_TEMPLATES: Omit<Account, "openingBalance" | "createdAt">[] = [
  {
    id: "acc-enbd",
    name: "Emirates NBD",
    institution: "Emirates NBD",
    type: "bank",
    currency: "AED",
    creditLimit: null,
    color: "#101114",
    icon: "landmark",
    lastFour: "4821",
    isArchived: false,
  },
  {
    id: "acc-savings",
    name: "Savings",
    institution: "Emirates NBD",
    type: "bank",
    currency: "AED",
    creditLimit: null,
    color: "#149e61",
    icon: "piggy-bank",
    lastFour: "9034",
    isArchived: false,
  },
  {
    id: "acc-cash",
    name: "Cash wallet",
    institution: null,
    type: "cash",
    currency: "AED",
    creditLimit: null,
    color: "#5741d8",
    icon: "banknote",
    lastFour: null,
    isArchived: false,
  },
  {
    id: "acc-fab",
    name: "FAB Credit Card",
    institution: "First Abu Dhabi Bank",
    type: "credit_card",
    currency: "AED",
    creditLimit: 15000,
    color: "#7132f5",
    icon: "credit-card",
    lastFour: "1188",
    isArchived: false,
  },
  {
    id: "acc-mashreq-card",
    name: "Mashreq Neo",
    institution: "Mashreq Bank",
    type: "credit_card",
    currency: "AED",
    creditLimit: 10000,
    color: "#5b1ecf",
    icon: "credit-card",
    lastFour: "7742",
    isArchived: false,
  },
  {
    id: "acc-hdfc",
    name: "HDFC Bank",
    institution: "HDFC Bank",
    type: "bank",
    currency: "INR",
    creditLimit: null,
    color: "#0e7490",
    icon: "landmark",
    lastFour: "6412",
    isArchived: false,
  },
  {
    id: "acc-hdfc-card",
    name: "HDFC Infinia",
    institution: "HDFC Bank",
    type: "credit_card",
    currency: "INR",
    creditLimit: 200000,
    color: "#be123c",
    icon: "credit-card",
    lastFour: "2208",
    isArchived: false,
  },
];

const ACCOUNT_CURRENCY = new Map(
  ACCOUNT_TEMPLATES.map((account) => [account.id, account.currency]),
);

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function dateFor(month: string, day: number, maxDay: number) {
  const safeDay = Math.min(day, maxDay);
  return `${month}-${`${safeDay}`.padStart(2, "0")}`;
}

export function seedDemoState(): DemoState {
  const month = currentMonthKey();
  const months = monthRange(6, month);
  const maxDay = dayOfMonth(todayISO());
  const createdAt = new Date().toISOString();

  const categories: Category[] = CATEGORY_SEED.map((category) => ({
    ...category,
    id: `cat-${slug(category.name)}`,
    createdAt,
  }));

  const categoryId = (name: string) =>
    `cat-${slug(name)}`;

  const transactions: Transaction[] = [];
  let sequence = 0;

  function add(
    monthKey: string,
    day: number,
    input: {
      accountId: string;
      type: Transaction["type"];
      amount: number;
      category?: string;
      merchant: string;
      notes?: string;
      transferAccountId?: string;
    },
  ) {
    const occurredOn = dateFor(monthKey, day, monthKey === month ? maxDay : 28);
    const amount = roundMoney(input.amount);
    const id = `tx-${monthKey}-${sequence++}`;
    transactions.push({
      id,
      accountId: input.accountId,
      categoryId:
        input.type === "transfer" ? null : categoryId(input.category ?? "Other"),
      type: input.type,
      amount,
      currency: ACCOUNT_CURRENCY.get(input.accountId) ?? "AED",
      occurredOn,
      merchant: input.merchant,
      notes: input.notes ?? null,
      transferAccountId: input.transferAccountId ?? null,
      createdAt: `${occurredOn}T${`${8 + (sequence % 12)}`.padStart(2, "0")}:00:00.000Z`,
    });
  }

  months.forEach((monthKey, index) => {
    const variation = index * 7.5;

    add(monthKey, 1, {
      accountId: "acc-enbd",
      type: "income",
      amount: 16500,
      category: "Salary",
      merchant: "Emirates NBD — Salary",
    });

    if (index === 2 || index === 4) {
      add(monthKey, 6, {
        accountId: "acc-enbd",
        type: "income",
        amount: 1850,
        category: "Freelance",
        merchant: "Upwork",
      });
    }

    add(monthKey, 2, {
      accountId: "acc-enbd",
      type: "expense",
      amount: 5200,
      category: "Rent",
      merchant: "Al Barsha apartment",
    });

    add(monthKey, 3, {
      accountId: "acc-enbd",
      type: "expense",
      amount: 2500,
      category: "Family",
      merchant: "Family support",
    });

    add(monthKey, 4, {
      accountId: "acc-enbd",
      type: "expense",
      amount: 1200,
      category: "Education",
      merchant: "GEMS School",
    });

    add(monthKey, 6, {
      accountId: "acc-enbd",
      type: "expense",
      amount: 420 + variation,
      category: "Utilities",
      merchant: "DEWA",
    });

    add(monthKey, 8, {
      accountId: "acc-enbd",
      type: "expense",
      amount: 150,
      category: "Health",
      merchant: "Fitness First",
    });

    add(monthKey, 9, {
      accountId: "acc-enbd",
      type: "transfer",
      amount: 2000,
      merchant: "Monthly savings",
      transferAccountId: "acc-savings",
    });

    add(monthKey, 10, {
      accountId: "acc-enbd",
      type: "transfer",
      amount: 400,
      merchant: "ATM withdrawal",
      transferAccountId: "acc-cash",
    });

    add(monthKey, 11, {
      accountId: "acc-enbd",
      type: "transfer",
      amount: 1050,
      merchant: "FAB card payment",
      transferAccountId: "acc-fab",
    });

    add(monthKey, 11, {
      accountId: "acc-enbd",
      type: "transfer",
      amount: 780,
      merchant: "Mashreq card payment",
      transferAccountId: "acc-mashreq-card",
    });

    add(monthKey, 12, {
      accountId: "acc-enbd",
      type: "expense",
      amount: 142 + variation / 3,
      category: "Groceries",
      merchant: "Spinneys",
    });

    add(monthKey, 14, {
      accountId: "acc-enbd",
      type: "expense",
      amount: 120,
      category: "Transport",
      merchant: "ENOC",
    });

    add(monthKey, 13, {
      accountId: "acc-fab",
      type: "expense",
      amount: 312.75 + variation,
      category: "Groceries",
      merchant: "Carrefour",
    });

    add(monthKey, 15, {
      accountId: "acc-fab",
      type: "expense",
      amount: 168.5,
      category: "Dining",
      merchant: "Ravi Restaurant",
    });

    add(monthKey, 17, {
      accountId: "acc-fab",
      type: "expense",
      amount: 425,
      category: "Shopping",
      merchant: "Amazon.ae",
    });

    add(monthKey, 19, {
      accountId: "acc-fab",
      type: "expense",
      amount: 95,
      category: "Transport",
      merchant: "Careem",
    });

    add(monthKey, 21, {
      accountId: "acc-fab",
      type: "expense",
      amount: 120,
      category: "Entertainment",
      merchant: "VOX Cinemas",
    });

    add(monthKey, 23, {
      accountId: "acc-fab",
      type: "expense",
      amount: 85,
      category: "Health",
      merchant: "Aster Pharmacy",
    });

    add(monthKey, 25, {
      accountId: "acc-fab",
      type: "expense",
      amount: 92,
      category: "Dining",
      merchant: "Starbucks",
    });

    add(monthKey, 14, {
      accountId: "acc-mashreq-card",
      type: "expense",
      amount: 188.2,
      category: "Groceries",
      merchant: "Lulu Hypermarket",
    });

    add(monthKey, 16, {
      accountId: "acc-mashreq-card",
      type: "expense",
      amount: 221,
      category: "Dining",
      merchant: "Pai Thai",
    });

    add(monthKey, 18, {
      accountId: "acc-mashreq-card",
      type: "expense",
      amount: 259.99,
      category: "Shopping",
      merchant: "Noon",
    });

    add(monthKey, 20, {
      accountId: "acc-mashreq-card",
      type: "expense",
      amount: 140,
      category: "Transport",
      merchant: "RTA",
    });

    add(monthKey, 22, {
      accountId: "acc-mashreq-card",
      type: "expense",
      amount: 64,
      category: "Dining",
      merchant: "Coffee House",
    });

    add(monthKey, 24, {
      accountId: "acc-mashreq-card",
      type: "expense",
      amount: 55,
      category: "Subscriptions",
      merchant: "Spotify",
    });

    add(monthKey, 26, {
      accountId: "acc-mashreq-card",
      type: "expense",
      amount: 149,
      category: "Shopping",
      merchant: "H&M",
    });

    add(monthKey, 13, {
      accountId: "acc-cash",
      type: "expense",
      amount: 82,
      category: "Groceries",
      merchant: "Baquer Moosa",
    });

    add(monthKey, 16, {
      accountId: "acc-cash",
      type: "expense",
      amount: 55,
      category: "Dining",
      merchant: "Karachi Darbar",
    });

    add(monthKey, 18, {
      accountId: "acc-cash",
      type: "expense",
      amount: 45,
      category: "Transport",
      merchant: "Taxi",
    });

    add(monthKey, 20, {
      accountId: "acc-cash",
      type: "expense",
      amount: 63,
      category: "Other",
      merchant: "Household",
    });

    add(monthKey, 7, {
      accountId: "acc-fab",
      type: "expense",
      amount: 99,
      category: "Subscriptions",
      merchant: "du Mobile",
    });

    if (index === months.length - 1) {
      add(monthKey, 19, {
        accountId: "acc-fab",
        type: "expense",
        amount: 240,
        category: "Dining",
        merchant: "Moti Roti",
      });
      add(monthKey, 20, {
        accountId: "acc-mashreq-card",
        type: "expense",
        amount: 180,
        category: "Dining",
        merchant: "Salt",
      });
      add(monthKey, 20, {
        accountId: "acc-fab",
        type: "expense",
        amount: 320,
        category: "Shopping",
        merchant: "IKEA",
      });
    }

    // The INR accounts keep their own ledger. None of these amounts touch AED
    // totals, and no exchange rate is stored or applied.
    const inrVariation = index * 85;

    add(monthKey, 1, {
      accountId: "acc-hdfc",
      type: "income",
      amount: 85000,
      category: "Salary",
      merchant: "HDFC — Salary",
    });

    add(monthKey, 2, {
      accountId: "acc-hdfc",
      type: "expense",
      amount: 18000,
      category: "Rent",
      merchant: "Bengaluru apartment",
    });

    add(monthKey, 3, {
      accountId: "acc-hdfc",
      type: "expense",
      amount: 10000,
      category: "Family",
      merchant: "Family support",
    });

    add(monthKey, 6, {
      accountId: "acc-hdfc",
      type: "expense",
      amount: 2800 + index * 40,
      category: "Utilities",
      merchant: "BESCOM",
    });

    add(monthKey, 8, {
      accountId: "acc-hdfc",
      type: "expense",
      amount: 2500,
      category: "Health",
      merchant: "Practo",
    });

    add(monthKey, 9, {
      accountId: "acc-hdfc",
      type: "transfer",
      amount: 9000,
      merchant: "HDFC card payment",
      transferAccountId: "acc-hdfc-card",
    });

    add(monthKey, 12, {
      accountId: "acc-hdfc",
      type: "expense",
      amount: 5200 + inrVariation,
      category: "Groceries",
      merchant: "BigBasket",
    });

    add(monthKey, 14, {
      accountId: "acc-hdfc",
      type: "expense",
      amount: 1600,
      category: "Transport",
      merchant: "Uber India",
    });

    add(monthKey, 13, {
      accountId: "acc-hdfc-card",
      type: "expense",
      amount: 3200,
      category: "Groceries",
      merchant: "Zepto",
    });

    add(monthKey, 15, {
      accountId: "acc-hdfc-card",
      type: "expense",
      amount: 1250 + inrVariation,
      category: "Dining",
      merchant: "Swiggy",
    });

    add(monthKey, 17, {
      accountId: "acc-hdfc-card",
      type: "expense",
      amount: 2400,
      category: "Shopping",
      merchant: "Amazon.in",
    });

    add(monthKey, 19, {
      accountId: "acc-hdfc-card",
      type: "expense",
      amount: 450,
      category: "Transport",
      merchant: "Uber",
    });

    add(monthKey, 21, {
      accountId: "acc-hdfc-card",
      type: "expense",
      amount: 649,
      category: "Subscriptions",
      merchant: "Netflix India",
    });

    add(monthKey, 23, {
      accountId: "acc-hdfc-card",
      type: "expense",
      amount: 750,
      category: "Health",
      merchant: "Apollo Pharmacy",
    });

    add(monthKey, 25, {
      accountId: "acc-hdfc-card",
      type: "expense",
      amount: 1800,
      category: "Shopping",
      merchant: "Myntra",
    });

    if (index === months.length - 1) {
      add(monthKey, 19, {
        accountId: "acc-hdfc",
        type: "expense",
        amount: 3700,
        category: "Dining",
        merchant: "Toit",
      });
      add(monthKey, 20, {
        accountId: "acc-hdfc-card",
        type: "expense",
        amount: 950,
        category: "Entertainment",
        merchant: "PVR Cinemas",
      });
    }
  });

  const net = new Map<string, number>(
    ACCOUNT_TEMPLATES.map((account) => [account.id, 0]),
  );
  for (const transaction of transactions) {
    const source = net.get(transaction.accountId) ?? 0;
    net.set(
      transaction.accountId,
      source + (transaction.type === "income" ? transaction.amount : -transaction.amount),
    );
    if (transaction.type === "transfer" && transaction.transferAccountId) {
      net.set(
        transaction.transferAccountId,
        (net.get(transaction.transferAccountId) ?? 0) + transaction.amount,
      );
    }
  }

  const accounts: Account[] = ACCOUNT_TEMPLATES.map((account) => ({
    ...account,
    openingBalance: roundMoney(
      (DESIRED_BALANCE[account.id] ?? 0) - (net.get(account.id) ?? 0),
    ),
    createdAt,
  }));

  const budgetMonths = months.slice(-3);
  const budgetAccountIds = [
    "acc-enbd",
    "acc-hdfc",
    "acc-fab",
    "acc-hdfc-card",
  ];
  const budgets: Budget[] = [];
  for (const budgetMonth of budgetMonths) {
    for (const accountId of budgetAccountIds) {
      const currency = ACCOUNT_CURRENCY.get(accountId);
      if (!currency) continue;
      for (const category of categories) {
        if (category.kind !== "expense") continue;
        const amount = SUGGESTED_BUDGETS[currency]?.[category.name];
        if (!amount) continue;
        budgets.push({
          id: `budget-${accountId}-${budgetMonth}-${category.id}`,
          accountId,
          categoryId: category.id,
          month: monthStart(budgetMonth),
          amount,
          currency,
        });
      }
    }
  }

  return {
    seededMonth: month,
    profile: {
      id: "demo-user",
      email: "jithin@asharibook.app",
      fullName: "Jithin",
      createdAt,
    },
    accounts,
    categories,
    transactions: transactions.sort((a, b) => {
      if (a.occurredOn === b.occurredOn) return b.createdAt.localeCompare(a.createdAt);
      return b.occurredOn.localeCompare(a.occurredOn);
    }),
    budgets,
  };
}
