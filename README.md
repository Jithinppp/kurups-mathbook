# AshariBook

A personal expense tracker for cards, cash and the month ahead. Built with
Next.js 16 and Supabase. Every account keeps its own currency.

AshariBook replaces the spreadsheet with a calmer flow: add accounts, record expenses
in a few taps, set category budgets, and see exactly where the month went —
without converting AED and INR into one misleading total.

## What's inside

- Email sign up / sign in with Supabase Auth
- Per-user data isolation with Postgres Row Level Security
- Bank, cash and credit-card accounts
- Signed amount ledger (`opening + income + transfers in − expenses − transfers out`)
- Credit-card outstanding and available-credit calculations
- Account-first dashboard: select a bank, cash source or card, then see that account's month, cash-flow trend and category breakdown
- Per-account category budgets with over-budget warnings
- Fast transaction sheet with category chips, same-currency transfer support, and explicit edit and delete actions
- Responsive web app with a desktop sidebar and a mobile bottom bar
- Native iOS/Android companion app with the same account-first workspace
- Native currency ledgers: an AED card stays AED, an INR card stays INR
- A practical list of popular account currencies, from AED and INR to USD, EUR, GBP, SAR, JPY and more
- Local demo workspace with both AED and INR sample activity, available with or without Supabase connected

The repository is an npm workspace with three parts:

```text
app/, components/, lib/   Next.js web app
mobile/                   Expo React Native app
packages/shared/          Domain types, finance math, dates, formatting, demo seed and mappers
```

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. With no Supabase environment variables, the app
starts in **demo mode**. Click **Open demo workspace** and you get a ready-made
workspace with six months of AED and INR activity. When Supabase is connected,
the same button appears as a compact secondary action on the sign-in screen.

The demo is stored in the browser's `localStorage`. Reset it from
**Settings → Workspace & data**.

## Run the mobile app

The Expo app uses the same Supabase project and the same account-first rules as
the web app. Install dependencies once from the repository root, then start
Expo:

```bash
npm install
npm run mobile
```

Expo prints a QR code for Expo Go. You can also open a local target directly:

```bash
npm run mobile:android
npm run mobile:ios      # macOS only
npm run mobile:web
npm run mobile:typecheck
```

Create `mobile/.env.local` (never commit it) with the same project credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The mobile demo works with or without these values. The demo state and live
read cache are stored with AsyncStorage on the device.

For live email confirmation on mobile, add these Supabase Auth redirect URLs:

- `asharibook://auth/callback` for development builds and production builds
- `exp://*/--/auth/callback` while testing with Expo Go

The callback route exchanges the PKCE code. Native builds use the
`app.asharibook.mobile` bundle/package identifier and the `asharibook://`
scheme.

## Connect Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql) for a
   new project. For an existing project created before native currencies, back
   up first and run these in order:
   1. [`202610210001_native_currencies.sql`](supabase/migrations/202610210001_native_currencies.sql)
   2. [`202610220001_account_scoped_budgets.sql`](supabase/migrations/202610220001_account_scoped_budgets.sql)
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
| `profiles` | One row per auth user: name and email |
| `accounts` | Bank, cash and credit-card accounts with signed opening balances |
| `categories` | Per-user expense and income categories |
| `transactions` | Expenses, income and transfers, in the account's currency |
| `budgets` | One budget amount per account, category and month |

Reporting helpers:

- `account_balances` view — opening balance plus the signed transaction ledger
- `monthly_spend` view — expenses and income by month, grouped by account and currency

A transaction's currency is copied from its source account by a database trigger,
so it cannot drift. A budget is attached to one account and its currency follows
that account. An account's currency is immutable once it has transactions. There
are no exchange rates and no base-currency conversion anywhere in the app.

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
balance toward zero. Transfers are excluded from expense reports and must stay
inside one currency. Balances, summaries and budgets are always shown in the
account's native currency.

Monthly reports only count the selected account's activity in that month. The
closing balance carries into the next month, so a salary recorded in January
does not disappear when February starts — only the month's income and spending
reset.

### Security

Every table has RLS enabled. A user can only read or write rows where
`auth.uid()` matches the row owner. A database trigger also verifies that both
sides of a transfer, any category and any budget account belong to the same user,
so a forged account ID cannot cross tenant boundaries.

## Demo mode

The demo workspace is available from the sign-in screen whether or not
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set. It uses a
local browser store, not Supabase, and never reads or writes project data. When
Supabase is connected, it stays a secondary option so visitors can preview the
interface before creating a real account.

## Scripts

```bash
npm run dev             # Next.js development server
npm run build           # production web build
npm run start           # serve the production web build
npm run lint            # eslint (web + mobile)
npm run typecheck       # web TypeScript
npm run mobile          # Expo dev server
npm run mobile:android  # open the Android target
npm run mobile:ios      # open the iOS target (macOS only)
npm run mobile:web      # open the Expo web target
npm run mobile:typecheck
npm run dev:all         # web and Expo side by side
```

## Structure

```text
app/
  (app)/            protected web workspace: dashboard, transactions, accounts, budgets, settings
  (auth)/           login and sign up
  auth/             Supabase confirmation callbacks
components/         web app shell, UI primitives, charts, dialogs
lib/                web auth/data contexts and shared-package re-exports
mobile/
  src/app/          Expo Router routes: auth group, tabs, transaction/budget/account modals
  src/components/   native UI primitives, charts, account/transaction/budget forms
  src/contexts/     mobile auth, data, selected-account and toast providers
packages/shared/    types, finance, dates, formatting, demo seed, Supabase mappers
supabase/schema.sql database schema, RLS, triggers and views
supabase/migrations/ upgrade SQL for existing projects
proxy.ts            Next.js 16 proxy for session refresh + route protection
DESIGN.md           Kraken-inspired design language used for the UI
```

## Notes and limits

- There is no base currency. Accounts can be created in a broad list of popular
  currencies, and the dashboard, activity and budget pages are scoped to the
  selected account rather than a currency total.
- Transfers between accounts in different currencies are intentionally blocked.
  If money moves across currencies outside the app, record it as an expense in
  the source account and income in the destination account. No exchange rate is
  stored or imputed.
- Existing budgets are attached to the first account in their currency by the
  account-scoped budgets migration. Plans with no matching account are removed.
- The old Excel workbook is not imported. This is a fresh start.
- The web app is responsive down to small phones; the Expo app gives the same
  workspace a native tab bar, bottom-sheet pickers and full-screen forms.
- Mobile write operations require a network connection. Reads of live data are
  cached on the device, and the demo workspace is fully local.
- Windows cannot run the iOS Simulator. Use Expo Go on a physical iPhone, a Mac,
  or an EAS build to test iOS.
