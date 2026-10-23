"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppIcon } from "@/components/app-icon";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, SegmentedControl } from "@/components/ui/input";
import { ACCOUNT_COLORS } from "@/lib/constants";
import { useData } from "@/lib/data-context";
import type { Category, CategoryKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS = [
  "shopping-cart",
  "utensils",
  "car",
  "shopping-bag",
  "home",
  "zap",
  "users",
  "graduation-cap",
  "heart-pulse",
  "clapperboard",
  "plane",
  "repeat",
  "undo-2",
  "file-text",
  "briefcase",
  "wallet",
  "gift",
  "coffee",
  "fuel",
  "dumbbell",
  "smartphone",
  "more-horizontal",
];

export function CategoryDialog({
  open,
  onOpenChange,
  editing = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Category | null;
}) {
  if (!open) return null;
  return (
    <CategoryDialogContent
      key={editing?.id ?? "new"}
      editing={editing}
      onOpenChange={onOpenChange}
    />
  );
}

function CategoryDialogContent({
  onOpenChange,
  editing,
}: {
  onOpenChange: (open: boolean) => void;
  editing: Category | null;
}) {
  const { categories, transactions, budgets, addCategory, updateCategory } = useData();
  const [name, setName] = useState(editing?.name ?? "");
  const [kind, setKind] = useState<CategoryKind>(editing?.kind ?? "expense");
  const [icon, setIcon] = useState(editing?.icon ?? ICONS[0]);
  const [color, setColor] = useState<string>(editing?.color ?? ACCOUNT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Give this category a name.");
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.id !== editing?.id &&
        category.kind === kind &&
        category.name.trim().toLowerCase() === trimmedName.toLowerCase(),
    );
    if (duplicate) {
      setError("A category with this name already exists for this type.");
      return;
    }

    if (editing && editing.kind !== kind) {
      const inUse =
        transactions.some((transaction) => transaction.categoryId === editing.id) ||
        budgets.some((budget) => budget.categoryId === editing.id);
      if (inUse) {
        setError(
          "This category is already used. Move or delete its transactions and budgets before changing its type.",
        );
        return;
      }
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: trimmedName, kind, icon, color });
        toast.success("Category updated");
      } else {
        await addCategory({ name: trimmedName, kind, icon, color });
        toast.success("Category added");
      }
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : editing
            ? "Could not update category."
            : "Could not add category.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={editing ? "Edit category" : "New category"}
      description={
        editing
          ? "Update its name, type, icon or colour. Changes apply everywhere."
          : "Create a category that fits the way you actually spend."
      }
    >
      <div className="space-y-5">
        <Field label="Name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. School transport"
            autoFocus
          />
        </Field>

        <Field label="Type">
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
          />
        </Field>

        <Field label="Icon">
          <div className="grid grid-cols-10 gap-1.5">
            {ICONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setIcon(item)}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg border transition",
                  icon === item
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-line-soft text-muted hover:border-line hover:text-ink",
                )}
                aria-label={`Use ${item} icon`}
              >
                <AppIcon name={item} className="size-4" />
              </button>
            ))}
          </div>
        </Field>

        <Field label="Colour">
          <div className="flex flex-wrap gap-2">
            {ACCOUNT_COLORS.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2 transition",
                  color === swatch
                    ? "border-ink ring-2 ring-ink/10"
                    : "border-transparent hover:scale-105",
                )}
                style={{ backgroundColor: swatch }}
                aria-label={`Use colour ${swatch}`}
              >
                {color === swatch ? <Check className="size-3.5 text-white" /> : null}
              </button>
            ))}
          </div>
        </Field>

        {error ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} loading={saving}>
            {editing ? "Save changes" : "Add category"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
