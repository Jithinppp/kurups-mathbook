"use client";

import {
  ArrowUpRight,
  BadgeCheck,
  Database,
  Layers,
  LogOut,
  Pencil,
  Plus,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AppIcon } from "@/components/app-icon";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { currencyLabel } from "@/lib/constants";
import { useData } from "@/lib/data-context";
import { currenciesForAccounts } from "@/lib/finance";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut, configured } = useAuth();
  const {
    profile,
    accounts,
    categories,
    transactions,
    budgets,
    updateProfile,
    resetDemo,
    deleteCategory,
  } = useData();
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const name = nameDraft ?? profile.fullName;

  async function saveName() {
    const nextName = name.trim();
    if (!nextName || nextName === profile.fullName) return;
    setSaving(true);
    try {
      await updateProfile(nextName);
      setNameDraft(nextName);
      toast.success("Profile updated");
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : "Could not update profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openNewCategory() {
    setEditingCategory(null);
    setCategoryOpen(true);
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryOpen(true);
  }

  function handleCategoryOpenChange(open: boolean) {
    setCategoryOpen(open);
    if (!open) setEditingCategory(null);
  }

  function requestDeleteCategory(category: Category) {
    setDeleteError(null);
    setCategoryToDelete(category);
  }

  function handleDeleteOpenChange(open: boolean) {
    if (!open && deletingCategory) return;
    if (!open) {
      setCategoryToDelete(null);
      setDeleteError(null);
    }
  }

  async function handleDeleteCategory() {
    if (!categoryToDelete) return;
    setDeleteError(null);
    setDeletingCategory(true);
    try {
      await deleteCategory(categoryToDelete.id);
      toast.success(`${categoryToDelete.name} deleted`);
      setCategoryToDelete(null);
    } catch (deleteFailure) {
      setDeleteError(
        deleteFailure instanceof Error
          ? deleteFailure.message
          : "Could not delete category.",
      );
    } finally {
      setDeletingCategory(false);
    }
  }

  const expenseCategories = categories.filter(
    (category) => category.kind === "expense",
  );
  const incomeCategories = categories.filter((category) => category.kind === "income");
  const currencies = currenciesForAccounts(accounts);
  const deleteTransactionCount = categoryToDelete
    ? transactions.filter(
        (transaction) => transaction.categoryId === categoryToDelete.id,
      ).length
    : 0;
  const deleteBudgetCount = categoryToDelete
    ? budgets.filter((budget) => budget.categoryId === categoryToDelete.id).length
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Settings"
        description="Your profile, categories and the details behind this workspace."
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Profile</CardTitle>
              <p className="mt-1 text-xs text-muted">
                The name shown around the app.
              </p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <UserRound className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Full name">
              <Input
                value={name}
                onChange={(event) => setNameDraft(event.target.value)}
                placeholder="Your name"
              />
            </Field>
            <Field label="Email">
              <Input value={user?.email ?? profile.email} disabled />
            </Field>
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 text-[11px] text-subtle">
                {user?.isDemo ? (
                  <>
                    <Database className="size-3.5" />
                    Demo profile stored in this browser
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-3.5 text-success" />
                    Secured by Supabase Auth
                  </>
                )}
              </div>
              <Button
                size="sm"
                onClick={saveName}
                loading={saving}
                disabled={!name.trim() || name.trim() === profile.fullName}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Native currencies</CardTitle>
              <p className="mt-1 text-xs text-muted">
                Each account keeps its own currency. Reports are scoped to an
                account, so nothing is converted.
              </p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-xl bg-success-soft text-success-dark">
              <BadgeCheck className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            {currencies.length > 0 ? (
              <div className="space-y-2">
                {currencies.map((currency) => {
                  const count = accounts.filter(
                    (account) => account.currency === currency,
                  ).length;
                  return (
                    <div
                      key={currency}
                      className="flex items-center justify-between rounded-xl border border-line-soft bg-canvas px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-ink">{currency}</p>
                        <p className="mt-0.5 text-[11px] text-subtle">
                          {currencyLabel(currency)}
                        </p>
                      </div>
                      <Badge variant="neutral">
                        {count} account{count === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-subtle">No accounts yet.</p>
            )}
            <p className="mt-3 text-[11px] leading-relaxed text-subtle">
              Balances, reports and budgets stay in their native currency. A
              card&apos;s currency is fixed after creation.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Categories</CardTitle>
            <p className="mt-1 text-xs text-muted">
              Used for budgets, reports and quick entry.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={openNewCategory}>
            <Plus className="size-3.5" />
            New category
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 pt-5">
          <CategoryGroup
            title="Expense categories"
            categories={expenseCategories}
            onEdit={openEditCategory}
            onDelete={requestDeleteCategory}
          />
          <CategoryGroup
            title="Income categories"
            categories={incomeCategories}
            onEdit={openEditCategory}
            onDelete={requestDeleteCategory}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Accounts</CardTitle>
              <p className="mt-1 text-xs text-muted">
                Manage credit cards, banks and cash sources.
              </p>
            </div>
            <span className="flex size-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <Layers className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <Link
              href="/accounts"
              className="flex items-center justify-between rounded-xl border border-line-soft px-4 py-3 transition hover:bg-canvas"
            >
              <div>
                <p className="text-[13px] font-medium text-ink">Open accounts</p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  Add, edit or archive an account
                </p>
              </div>
              <ArrowUpRight className="size-4 text-subtle" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Workspace & data</CardTitle>
              <p className="mt-1 text-xs text-muted">
                Sign out or reset the local preview.
              </p>
            </div>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-xl",
                user?.isDemo
                  ? "bg-warning-soft text-warning"
                  : "bg-success-soft text-success-dark",
              )}
            >
              <Database className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-line-soft px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-ink">Connection</p>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {user?.isDemo
                    ? "Local demo mode — data stays in this browser"
                    : configured
                      ? "Connected to Supabase"
                      : "Supabase environment variables are missing"}
                </p>
              </div>
              <Badge variant={user?.isDemo ? "warning" : "success"}>
                {user?.isDemo ? "Demo" : "Live"}
              </Badge>
            </div>

            {user?.isDemo ? (
              confirmReset ? (
                <div className="flex items-center gap-2 rounded-xl bg-warning-soft p-3">
                  <p className="flex-1 text-[11px] text-warning">
                    Reset all demo transactions and budgets?
                  </p>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      resetDemo();
                      setConfirmReset(false);
                      toast.success("Demo workspace reset");
                    }}
                  >
                    Reset
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setConfirmReset(true)}
                >
                  <RefreshCcw className="size-4" />
                  Reset demo data
                </Button>
              )
            ) : null}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => void signOut()}
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-line-soft bg-white px-4 py-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand text-white">
            <span className="text-[11px] font-bold">K</span>
          </span>
          <div>
            <p className="text-xs font-semibold text-ink">AshariBook</p>
            <p className="text-[11px] text-subtle">
              A quieter way to keep the month honest.
            </p>
          </div>
        </div>
        <p className="text-[10px] text-subtle">
          Next.js + Supabase · Native currencies
        </p>
      </div>

      <CategoryDialog
        open={categoryOpen}
        onOpenChange={handleCategoryOpenChange}
        editing={editingCategory}
      />

      <Dialog
        open={Boolean(categoryToDelete)}
        onOpenChange={handleDeleteOpenChange}
        title={categoryToDelete ? `Delete ${categoryToDelete.name}?` : "Delete category?"}
        description="This removes the category from your workspace. This cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handleDeleteOpenChange(false)}
              disabled={deletingCategory}
            >
              Keep category
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => void handleDeleteCategory()}
              loading={deletingCategory}
            >
              Delete category
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-line-soft bg-canvas px-3.5 py-3 text-xs leading-relaxed text-muted">
            {deleteTransactionCount > 0 ? (
              <p>
                {deleteTransactionCount} transaction
                {deleteTransactionCount === 1 ? "" : "s"} will stay in the ledger
                and become uncategorized.
              </p>
            ) : null}
            {deleteBudgetCount > 0 ? (
              <p className={deleteTransactionCount > 0 ? "mt-1.5" : undefined}>
                {deleteBudgetCount} budget plan
                {deleteBudgetCount === 1 ? "" : "s"} using this category will be
                removed.
              </p>
            ) : null}
            {deleteTransactionCount === 0 && deleteBudgetCount === 0 ? (
              <p>No transactions or budgets use this category.</p>
            ) : null}
          </div>
          {deleteError ? (
            <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
              {deleteError}
            </p>
          ) : null}
        </div>
      </Dialog>
    </div>
  );
}

function CategoryGroup({
  title,
  categories,
  onEdit,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
        {title}
      </p>
      <div className="space-y-1.5">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex w-full items-center gap-2 rounded-xl border border-line-soft px-3 py-2.5"
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `${category.color}14`,
                color: category.color,
              }}
            >
              <AppIcon name={category.icon} className="size-3.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
              {category.name}
            </span>
            <button
              type="button"
              onClick={() => onEdit(category)}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-subtle transition hover:bg-black/[0.05] hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              aria-label={`Edit ${category.name}`}
            >
              <Pencil className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(category)}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-subtle transition hover:bg-danger-soft hover:text-danger focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-danger/15"
              aria-label={`Delete ${category.name}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
        {categories.length === 0 ? (
          <p className="text-xs text-subtle">No categories yet.</p>
        ) : null}
      </div>
    </div>
  );
}
