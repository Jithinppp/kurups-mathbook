-- ============================================================
--  Kurup — expense tracker schema
--  Run this once in the Supabase SQL editor.
--  Base currency: AED
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- enums ------------------------------------------------
do $$ begin
  create type public.account_type as enum ('bank', 'cash', 'credit_card');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.transaction_type as enum ('expense', 'income', 'transfer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.category_kind as enum ('expense', 'income');
exception when duplicate_object then null; end $$;

-- ---------- profiles ---------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  base_currency text not null default 'AED',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- accounts ---------------------------------------------
create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  institution text,
  type public.account_type not null default 'bank',
  currency text not null default 'AED' check (char_length(currency) = 3),
  -- Signed opening balance. Bank/cash positive, card debt negative.
  opening_balance numeric(14, 2) not null default 0,
  credit_limit numeric(14, 2) check (credit_limit is null or credit_limit >= 0),
  color text not null default '#7132f5',
  icon text not null default 'wallet',
  last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- categories -------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  kind public.category_kind not null default 'expense',
  icon text not null default 'more-horizontal',
  color text not null default '#9497a9',
  created_at timestamptz not null default now()
);

create unique index if not exists categories_user_kind_name_idx
  on public.categories (user_id, kind, lower(name));

-- ---------- transactions -----------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'AED' check (char_length(currency) = 3),
  -- AED per one unit of `currency`. AED = 1, INR ≈ 0.0426, USD ≈ 3.6725.
  fx_rate numeric(18, 8) not null default 1 check (fx_rate > 0),
  base_amount numeric(18, 2) generated always as
    (round(amount * fx_rate, 2)) stored,
  occurred_on date not null default current_date,
  merchant text,
  notes text,
  transfer_account_id uuid references public.accounts (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transaction_transfer_shape check (
    (type = 'transfer'
      and transfer_account_id is not null
      and category_id is null
      and transfer_account_id <> account_id)
    or
    (type in ('expense', 'income') and transfer_account_id is null)
  )
);

-- ---------- budgets ----------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  month date not null check (month = date_trunc('month', month)::date),
  amount numeric(14, 2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  constraint budgets_user_category_month_key unique (user_id, category_id, month)
);

-- ---------- indexes ----------------------------------------------
create index if not exists accounts_user_idx
  on public.accounts (user_id, is_archived);

create index if not exists categories_user_kind_idx
  on public.categories (user_id, kind);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, occurred_on desc);

create index if not exists transactions_account_idx
  on public.transactions (account_id);

create index if not exists transactions_transfer_account_idx
  on public.transactions (transfer_account_id);

create index if not exists transactions_category_idx
  on public.transactions (category_id);

create index if not exists budgets_user_month_idx
  on public.budgets (user_id, month);

-- ---------- updated_at helper ------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at on public.transactions;
create trigger transactions_set_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

-- ---------- cross-tenant guards ----------------------------------
create or replace function public.validate_transaction_ownership()
returns trigger
language plpgsql
as $$
begin
  if not exists (
    select 1 from public.accounts
    where id = new.account_id and user_id = new.user_id
  ) then
    raise exception 'Source account does not belong to this user';
  end if;

  if new.transfer_account_id is not null and not exists (
    select 1 from public.accounts
    where id = new.transfer_account_id and user_id = new.user_id
  ) then
    raise exception 'Destination account does not belong to this user';
  end if;

  if new.type = 'transfer' and new.transfer_account_id is not null then
    if (
      select currency from public.accounts where id = new.account_id
    ) is distinct from (
      select currency from public.accounts where id = new.transfer_account_id
    ) then
      raise exception 'Transfers between different currencies are not supported';
    end if;
  end if;

  if new.category_id is not null and not exists (
    select 1 from public.categories
    where id = new.category_id and user_id = new.user_id
  ) then
    raise exception 'Category does not belong to this user';
  end if;

  return new;
end;
$$;

drop trigger if exists transactions_validate_ownership on public.transactions;
create trigger transactions_validate_ownership
  before insert or update on public.transactions
  for each row execute function public.validate_transaction_ownership();

-- ---------- new user provisioning --------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, base_currency)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    'AED'
  )
  on conflict (id) do nothing;

  insert into public.accounts (user_id, name, type, currency, color, icon)
  values (new.id, 'Cash', 'cash', 'AED', '#5741d8', 'banknote');

  insert into public.categories (user_id, name, kind, icon, color)
  select
    new.id,
    seed.name,
    seed.kind::public.category_kind,
    seed.icon,
    seed.color
  from (values
    ('Groceries',    'expense', 'shopping-cart',  '#7132f5'),
    ('Dining',       'expense', 'utensils',       '#5b1ecf'),
    ('Transport',    'expense', 'car',            '#101114'),
    ('Shopping',     'expense', 'shopping-bag',   '#b45309'),
    ('Utilities',    'expense', 'zap',            '#0e7490'),
    ('Rent',         'expense', 'home',           '#5741d8'),
    ('Family',       'expense', 'users',          '#c2410c'),
    ('Education',    'expense', 'graduation-cap', '#0891b2'),
    ('Health',       'expense', 'heart-pulse',    '#be123c'),
    ('Entertainment','expense', 'clapperboard',   '#149e61'),
    ('Travel',       'expense', 'plane',          '#2563eb'),
    ('Subscriptions','expense', 'repeat',         '#686b82'),
    ('Fees',         'expense', 'file-text',      '#52525b'),
    ('Other',        'expense', 'more-horizontal','#9497a9'),
    ('Salary',       'income',  'briefcase',      '#149e61'),
    ('Freelance',    'income',  'wallet',         '#0e7490'),
    ('Refund',       'income',  'undo-2',         '#7132f5'),
    ('Other income', 'income',  'gift',           '#686b82')
  ) as seed(name, kind, icon, color)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row level security -----------------------------------
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "accounts: own rows" on public.accounts;
create policy "accounts: own rows"
  on public.accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "categories: own rows" on public.categories;
create policy "categories: own rows"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "transactions: own rows" on public.transactions;
create policy "transactions: own rows"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "budgets: own rows" on public.budgets;
create policy "budgets: own rows"
  on public.budgets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------- reporting views --------------------------------------
create or replace view public.account_balances
with (security_invoker = true)
as
select
  a.id,
  a.user_id,
  a.name,
  a.institution,
  a.type,
  a.currency,
  a.opening_balance,
  a.credit_limit,
  a.color,
  a.icon,
  a.last_four,
  a.is_archived,
  a.created_at,
  a.opening_balance + coalesce(sum(
    case
      when t.account_id = a.id and t.type = 'income' then t.amount
      when t.account_id = a.id then -t.amount
      when t.transfer_account_id = a.id then t.amount
      else 0
    end
  ), 0) as balance
from public.accounts a
left join public.transactions t
  on t.account_id = a.id or t.transfer_account_id = a.id
group by a.id;

create or replace view public.monthly_spend
with (security_invoker = true)
as
select
  user_id,
  date_trunc('month', occurred_on)::date as month,
  sum(case when type = 'expense' then base_amount else 0 end) as expenses,
  sum(case when type = 'income' then base_amount else 0 end) as income
from public.transactions
group by user_id, date_trunc('month', occurred_on)::date;

-- ---------- grants -----------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.profiles, public.accounts, public.categories,
     public.transactions, public.budgets
  to authenticated;
grant select on public.account_balances, public.monthly_spend to authenticated;

-- ============================================================
--  Notes
--  • Sign convention: balances = opening + income + transfers in
--    − expenses − transfers out.
--  • Credit cards use a negative balance when money is owed.
--  • Transfers are one row with a source account + a destination
--    account. They are excluded from expense reports.
--  • `base_amount` is generated from amount × fx_rate (AED per
--    unit of the transaction currency), so reports stay in AED.
--  • The app also works without these tables in local demo mode.
-- ============================================================
