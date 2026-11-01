import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  accountPayload,
  mapAccount,
  mapBudget,
  mapCategory,
  mapProfile,
  mapTransaction,
  transactionPayload,
  type AccountRow,
  type BudgetDbRow,
  type CategoryRow,
  type ProfileRow,
  type TransactionRow,
} from "@/lib/supabase/mappers";
import type {
  AccountInput,
  BudgetInput,
  CategoryInput,
  TransactionInput,
} from "@/lib/types";
import { budgetWriteMessage } from "./budget-write-message";
import type { DataAdapter } from "./types";

export class SupabaseDataAdapter implements DataAdapter {
  private requireSupabase() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("Supabase is not configured.");
    return supabase;
  }

  async load() {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const [accountsResult, categoriesResult, budgetsResult, profileResult] =
      await Promise.all([
        supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("month", { ascending: false }),
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      ]);

    const firstError =
      accountsResult.error ??
      categoriesResult.error ??
      budgetsResult.error ??
      profileResult.error;
    if (firstError) throw new Error(firstError.message);

    const transactionRows: TransactionRow[] = [];
    const pageSize = 500;
    for (let from = 0; ; from += pageSize) {
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);
      if (transactionError) throw new Error(transactionError.message);
      const page = (transactionData as TransactionRow[] | null) ?? [];
      transactionRows.push(...page);
      if (page.length < pageSize) break;
    }

    let profileRow = profileResult.data as ProfileRow | null;
    if (!profileRow) {
      const { data: created, error: createError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: user.email ?? "",
            full_name: user.user_metadata?.full_name ?? (user.email ?? "").split("@")[0],
          },
          { onConflict: "id" },
        )
        .select("*")
        .single();
      if (createError) throw new Error(createError.message);
      profileRow = created as ProfileRow;
    }

    return {
      profile: mapProfile(profileRow),
      accounts: (accountsResult.data as AccountRow[]).map(mapAccount),
      categories: (categoriesResult.data as CategoryRow[]).map(mapCategory),
      transactions: transactionRows.map(mapTransaction),
      budgets: (budgetsResult.data as BudgetDbRow[]).map(mapBudget),
    };
  }

  async addAccount(input: AccountInput) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: insertError } = await supabase
      .from("accounts")
      .insert({ ...accountPayload(input), user_id: user.id })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);
  }

  async updateAccount(id: string, input: AccountInput) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: updateError } = await supabase
      .from("accounts")
      .update(accountPayload(input))
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) throw new Error(updateError.message);
  }

  async archiveAccount(id: string) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: archiveError } = await supabase
      .from("accounts")
      .update({ is_archived: true })
      .eq("id", id)
      .eq("user_id", user.id);
    if (archiveError) throw new Error(archiveError.message);
  }

  async restoreAccount(id: string) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: restoreError } = await supabase
      .from("accounts")
      .update({ is_archived: false })
      .eq("id", id)
      .eq("user_id", user.id);
    if (restoreError) throw new Error(restoreError.message);
  }

  async addTransaction(input: TransactionInput) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: insertError } = await supabase
      .from("transactions")
      .insert({ ...transactionPayload(input), user_id: user.id })
      .select("*")
      .single();
    if (insertError) throw new Error(insertError.message);
  }

  async updateTransaction(id: string, input: TransactionInput) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: updateError } = await supabase
      .from("transactions")
      .update(transactionPayload(input))
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) throw new Error(updateError.message);
  }

  async deleteTransaction(id: string) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) throw new Error(deleteError.message);
  }

  async setBudget(input: BudgetInput) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const month = `${input.month.slice(0, 7)}-01`;
    const { error: upsertError } = await supabase
      .from("budgets")
      .upsert(
        {
          user_id: user.id,
          account_id: input.accountId,
          category_id: input.categoryId,
          month,
          amount: input.amount,
          currency: input.currency,
        },
        { onConflict: "user_id,account_id,category_id,month" },
      );
    if (upsertError) {
      throw new Error(budgetWriteMessage(upsertError.message));
    }
  }

  async setBudgets(month: string, inputs: BudgetInput[]) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const normalizedMonth = `${month.slice(0, 7)}-01`;
    const { error: upsertError } = await supabase
      .from("budgets")
      .upsert(
        inputs.map((input) => ({
          user_id: user.id,
          account_id: input.accountId,
          category_id: input.categoryId,
          month: normalizedMonth,
          amount: input.amount,
          currency: input.currency,
        })),
        { onConflict: "user_id,account_id,category_id,month" },
      );
    if (upsertError) {
      throw new Error(budgetWriteMessage(upsertError.message));
    }
  }

  async deleteBudget(id: string) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: deleteError } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) throw new Error(deleteError.message);
  }

  async addCategory(input: CategoryInput) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: insertError } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: input.name.trim(),
        kind: input.kind,
        icon: input.icon,
        color: input.color,
      });
    if (insertError) throw new Error(insertError.message);
  }

  async updateCategory(id: string, input: CategoryInput) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: updateError } = await supabase
      .from("categories")
      .update({
        name: input.name.trim(),
        kind: input.kind,
        icon: input.icon,
        color: input.color,
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (updateError) throw new Error(updateError.message);
  }

  async deleteCategory(id: string) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: deleteError } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (deleteError) throw new Error(deleteError.message);
  }

  async updateProfile(fullName: string) {
    const supabase = this.requireSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("You need to sign in first.");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", user.id);
    if (updateError) throw new Error(updateError.message);
  }
}
