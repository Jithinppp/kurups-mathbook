-- Permanently delete the calling user and every workspace row they own.
--
-- The function is SECURITY DEFINER so it can remove the row from auth.users.
-- Deleting that row cascades through profiles, accounts, categories,
-- transactions and budgets. Only signed-in users may execute it.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'You must be signed in to delete your account.'
      using errcode = '42501';
  end if;

  delete from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'Account not found.'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
