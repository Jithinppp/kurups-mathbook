-- ============================================================
--  AshariBook — account-scoped budgets migration
--  Run after 202610210001_native_currencies.sql.
--
--  Budgets now belong to one bank, cash source or credit card instead
--  of a currency. Existing plans are attached to the first account in
--  the matching currency. Plans with no matching account are removed
--  because there is nothing for them to belong to.
--
--  Back up the project before running this in the SQL editor.
-- ============================================================

-- ---------- budgets: add the account scope --------------------
alter table public.budgets
  add column if not exists account_id uuid;

-- Attach each existing plan to the oldest account in its currency.
update public.budgets b
set account_id = (
  select a.id
  from public.accounts a
  where a.user_id = b.user_id
    and a.currency = b.currency
  order by a.is_archived, a.created_at, a.id
  limit 1
)
where b.account_id is null;

-- No account means no meaningful budget in the account-first model.
delete from public.budgets
where account_id is null;

alter table public.budgets
  alter column account_id set not null;

-- Add the account foreign key if this is an upgrade, not a fresh install.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.budgets'::regclass
      and conname = 'budgets_account_id_fkey'
  ) then
    alter table public.budgets
      add constraint budgets_account_id_fkey
      foreign key (account_id) references public.accounts (id)
      on delete cascade;
  end if;
end;
$$;

-- ---------- budgets: one plan per account + category + month --
alter table public.budgets
  drop constraint if exists budgets_user_category_month_key;

alter table public.budgets
  drop constraint if exists budgets_user_category_month_currency_key;

alter table public.budgets
  drop constraint if exists budgets_user_account_category_month_key;

alter table public.budgets
  add constraint budgets_user_account_category_month_key
  unique (user_id, account_id, category_id, month);

drop index if exists public.budgets_user_month_idx;

create index if not exists budgets_user_account_month_idx
  on public.budgets (user_id, account_id, month);

-- ---------- budgets: ownership + native currency --------------
create or replace function public.validate_budget_ownership()
returns trigger
language plpgsql
as $$
declare
  account_currency text;
begin
  select currency
    into account_currency
  from public.accounts
  where id = new.account_id and user_id = new.user_id;

  if account_currency is null then
    raise exception 'Budget account does not belong to this user';
  end if;

  if not exists (
    select 1 from public.categories
    where id = new.category_id and user_id = new.user_id
  ) then
    raise exception 'Budget category does not belong to this user';
  end if;

  new.currency := account_currency;
  return new;
end;
$$;

drop trigger if exists budgets_validate_ownership on public.budgets;
create trigger budgets_validate_ownership
  before insert or update on public.budgets
  for each row execute function public.validate_budget_ownership();

-- ---------- reporting view: account aware --------------------
drop view if exists public.monthly_spend;

create view public.monthly_spend
with (security_invoker = true)
as
select
  user_id,
  account_id,
  currency,
  date_trunc('month', occurred_on)::date as month,
  sum(case when type = 'expense' then amount else 0 end) as expenses,
  sum(case when type = 'income' then amount else 0 end) as income
from public.transactions
group by user_id, account_id, currency, date_trunc('month', occurred_on)::date;

grant select on public.monthly_spend to authenticated;

notify pgrst, 'reload schema';
