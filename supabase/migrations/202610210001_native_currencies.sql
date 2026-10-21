-- ============================================================
--  Kurup — native currencies migration
--  Run once in the Supabase SQL editor on an existing project.
--  Back up the project first. Existing transaction amounts and account
--  currencies are preserved; only the conversion columns are dropped.
--
--  Removes AED conversion, freezes each account's currency, and
--  scopes budgets by currency. Existing budgets become AED budgets.
-- ============================================================

-- The reporting view depends on base_amount.
drop view if exists public.monthly_spend;

-- ---------- profiles: remove the base currency concept -----------
alter table public.profiles
  drop column if exists base_currency;

-- ---------- transactions: drop conversion columns ----------------
alter table public.transactions
  drop column if exists base_amount;

alter table public.transactions
  drop column if exists fx_rate;

-- Make existing ledger rows agree with their source account before
-- the trigger starts enforcing it.
update public.transactions t
set currency = a.currency
from public.accounts a
where t.account_id = a.id
  and t.currency is distinct from a.currency;

-- ---------- budgets: scope by currency ---------------------------
alter table public.budgets
  add column if not exists currency text not null default 'AED';

-- Remove any unique key that only covers user/category/month.
do $$
declare
  budget_constraint record;
begin
  for budget_constraint in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.budgets'::regclass
      and con.contype = 'u'
      and (
        select array_agg(att.attname::text order by keys.ord)
        from unnest(con.conkey) with ordinality as keys(attnum, ord)
        join pg_attribute att
          on att.attrelid = con.conrelid
         and att.attnum = keys.attnum
      ) = array['user_id', 'category_id', 'month']::text[]
  loop
    execute format(
      'alter table public.budgets drop constraint %I',
      budget_constraint.conname
    );
  end loop;
end $$;

alter table public.budgets
  drop constraint if exists budgets_user_category_month_currency_key;

alter table public.budgets
  add constraint budgets_user_category_month_currency_key
  unique (user_id, category_id, month, currency);

alter table public.budgets
  drop constraint if exists budgets_currency_check;

alter table public.budgets
  add constraint budgets_currency_check
  check (char_length(currency) = 3);

create index if not exists budgets_user_currency_month_idx
  on public.budgets (user_id, currency, month);

-- ---------- transaction currency follows the account -------------
create or replace function public.validate_transaction_ownership()
returns trigger
language plpgsql
as $$
declare
  source_currency text;
  destination_currency text;
begin
  select currency into source_currency
  from public.accounts
  where id = new.account_id and user_id = new.user_id;

  if source_currency is null then
    raise exception 'Source account does not belong to this user';
  end if;

  new.currency := source_currency;

  if new.transfer_account_id is not null then
    select currency into destination_currency
    from public.accounts
    where id = new.transfer_account_id and user_id = new.user_id;

    if destination_currency is null then
      raise exception 'Destination account does not belong to this user';
    end if;
  end if;

  if new.type = 'transfer' and new.transfer_account_id is not null then
    if destination_currency is distinct from source_currency then
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

-- ---------- account currency is fixed once it has activity ------
create or replace function public.prevent_account_currency_change()
returns trigger
language plpgsql
as $$
begin
  if new.currency is distinct from old.currency and exists (
    select 1
    from public.transactions
    where account_id = old.id or transfer_account_id = old.id
  ) then
    raise exception 'Account currency cannot change after transactions exist';
  end if;

  return new;
end;
$$;

drop trigger if exists accounts_prevent_currency_change on public.accounts;
create trigger accounts_prevent_currency_change
  before update of currency on public.accounts
  for each row execute function public.prevent_account_currency_change();

-- ---------- new users no longer need a base currency -------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
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

-- ---------- reporting view, now grouped by currency --------------
create or replace view public.monthly_spend
with (security_invoker = true)
as
select
  user_id,
  currency,
  date_trunc('month', occurred_on)::date as month,
  sum(case when type = 'expense' then amount else 0 end) as expenses,
  sum(case when type = 'income' then amount else 0 end) as income
from public.transactions
group by user_id, currency, date_trunc('month', occurred_on)::date;

grant select on public.monthly_spend to authenticated;

-- Refresh PostgREST's schema cache so the new budget column is visible to the
-- app immediately after this migration runs.
notify pgrst, 'reload schema';
