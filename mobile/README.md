# AshariBook mobile

Expo React Native companion app for AshariBook. It shares the web app's
Supabase project and the `@asharibook/shared` domain package.

## Run

From the repository root:

```bash
npm install
npm run mobile
```

Or use the workspace scripts:

```bash
npm run mobile:android
npm run mobile:ios      # macOS only
npm run mobile:web
npm run mobile:typecheck
```

## Environment

Copy `.env.example` to `.env.local` and use the same Supabase project as the web
app:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The demo workspace works without Supabase. Live reads are cached with
AsyncStorage; writes require a network connection.

## Live auth redirects

Add these redirect URLs in the Supabase dashboard under Authentication → URL
Configuration:

- `asharibook://auth/callback` for development and production builds
- `exp://*/--/auth/callback` for Expo Go

The `auth/callback` route exchanges the PKCE code and opens the workspace.

## Structure

```text
src/app/          Expo Router routes
  (auth)/         login and sign up
  (app)/(tabs)/   Home, Activity, Budgets, Accounts
  (app)/          settings and transaction/budget/account modals
  auth/callback   email confirmation callback
src/components/   native UI, charts and forms
src/contexts/     auth, data, selected account and toast providers
src/lib/          Supabase client, storage keys and theme
```

The app uses the same account-first rules as the web app: one selected account
at a time, native currencies with no conversion, same-currency transfers only,
and monthly per-account budgets.
