export function budgetWriteMessage(message: string): string {
  const lower = message.toLowerCase();
  const missingSchema =
    lower.includes("account_id") ||
    lower.includes("currency") ||
    lower.includes("schema cache") ||
    lower.includes("does not exist") ||
    lower.includes("could not find") ||
    lower.includes("no unique") ||
    lower.includes("on_conflict") ||
    lower.includes("on conflict") ||
    lower.includes("exclusion constraint");

  if (missingSchema) {
    return "Budgets now belong to an account. Run the latest Supabase migrations (202610210001_native_currencies.sql and 202610220001_account_scoped_budgets.sql), then try again.";
  }

  return message;
}
