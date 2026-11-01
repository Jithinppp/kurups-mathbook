-- New users should choose their first bank, cash source or credit card during
-- onboarding. Stop provisioning a default AED Cash account from the auth
-- trigger. Starter categories are still created because they are workspace
-- metadata, not a financial account.

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
