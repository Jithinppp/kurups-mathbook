# Kurup

A personal expense tracker for cards, cash and the month ahead. Built with
Next.js 16 and Supabase, with AED as the base currency.

Kurup replaces the spreadsheet with a calmer flow: add accounts, record expenses
in a few taps, set category budgets, and see exactly where the month went.

## What's inside

- Email sign up / sign in with Supabase Auth
- Per-user data isolation with Postgres Row Level Security
- Bank, cash and credit-card accounts
- Signed amount ledger (`opening + income + transfers in − expenses − transfers out`)
- Credit-card outstanding and available-credit calculations
- Month-by-month dashboard with cash-flow trend and category breakdown
- Category budgets with over-budget warnings
- Fast transaction sheet with category chips and transfer support
- Mobile-first layout with a desktop sidebar and a mobile bottom bar
- AED base currency with original transaction currency + FX rate preserved
- Local demo workspace available from the sign-in screen, with or without Supabase connected

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. With no Supabase environment variables, the app
starts in **demo mode**. Click **Open demo workspace** and you get a ready-made
workspace with six months of sample activity. When Supabase is connected, the
same button appears as a compact secondary action on the sign-in screen.

The demo is stored in the browser's `localStorage`. Reset it from
**Settings → Workspace & data**.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql).
3. In **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (or your deployed URL)
   - Redirect URLs: `http://localhost:3000/auth/callback` and
     `http://localhost:3000/auth/confirm`
4. Copy `.env.example` to `.env.local` and fill in the project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Restart `npm run dev`. The login screen now uses real email authentication.

Supabase's default email confirmation flow works with both `/auth/callback`
(PKCE code exchange) and `/auth/confirm` (token hash). Once a user confirms and
signs in, the database trigger creates their profile, a Cash account and the
starter categories automatically.

## Schema

The full schema is in [`supabase/schema.sql`](supabase/schema.sql).

| Table | Purpose |
| --- | --- |
| `profiles` | One row per auth user: name, email, fixed base currency |
| `accounts` | Bank, cash and credit-card accounts with signed opening balances |
| `categories` | Per-user expense and income categories |
| `transactions` | Expenses, income and transfers, in the account's currency |
| `budgets` | One budget amount per category per month |

Reporting helpers:

- `account_balances` view — opening balance plus the signed transaction ledger
- `monthly_spend` view — base-currency expenses and income by month
- `base_amount` — generated `amount × fx_rate`, where `fx_rate` is AED per unit
  of the transaction currency

### Balance rules

```text
bank/cash balance = opening
                  + income
                  + transfers in
                  − expenses
                  − transfers out

credit card outstanding = max(0, −(opening + income + transfers in
                                  − expenses − transfers out))
```

A credit card starts with a negative opening balance when money is owed. Card
payments are transfers from a bank account to the card, which raises the card
balance toward zero. Transfers are excluded from expense reports.

### Security

Every table has RLS enabled. A user can only read or write rows where
`auth.uid()` matches the row owner. A database trigger also verifies that both
sides of a transfer and any category belong to the same user, so a forged
account ID cannot cross tenant boundaries.

## Demo mode

The demo workspace is available from the sign-in screen whether or not
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. It uses a
local browser store, not Supabase, and never reads or writes project data. When
Supabase is connected, it stays a secondary option so visitors can preview the
interface before creating a real account.

## Scripts

```bash
npm run dev        # development server
npm run build      # production build
npm run start      # serve the production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Structure

```text
app/
  (app)/            protected workspace: dashboard, transactions, accounts, budgets, settings
  (auth)/           login and sign up
  auth/             Supabase confirmation callbacks
components/         app shell, UI primitives, charts, dialogs
lib/                auth context, data context, finance math, demo seed, Supabase clients
supabase/schema.sql database schema, RLS, triggers and views
proxy.ts            Next.js 16 proxy for session refresh + route protection
DESIGN.md           Kraken-inspired design language used for the UI
```

## Notes and limits

- Base currency is AED for this build and is fixed after setup.
- Transfers between accounts in different currencies are intentionally blocked
  for now; transactions themselves can still be recorded in INR, USD, EUR or GBP
  using the stored FX rate.
- The old Excel workbook is not imported. This is a fresh start.
- The app is web-first; the layout is designed to work well down to small phones.
