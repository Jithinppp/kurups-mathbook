"use client";

import { Banknote, CreditCard, Landmark, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { CURRENCIES, DEFAULT_COLOR } from "@/lib/constants";
import { useData } from "@/lib/data-context";
import type { Account, AccountType } from "@/lib/types";
import { cn, roundMoney } from "@/lib/utils";

const TYPES: { value: AccountType; label: string; icon: ReactNode }[] = [
  { value: "bank", label: "Bank", icon: <Landmark className="size-3.5" /> },
  { value: "cash", label: "Cash", icon: <Banknote className="size-3.5" /> },
  {
    value: "credit_card",
    label: "Credit card",
    icon: <CreditCard className="size-3.5" />,
  },
];

export function AccountDialog({
  open,
  onOpenChange,
  editing,
  defaultType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing?: Account | null;
  defaultType?: AccountType;
}) {
  if (!open) return null;
  return (
    <AccountDialogContent
      key={editing?.id ?? `new-${defaultType ?? "bank"}`}
      onOpenChange={onOpenChange}
      editing={editing}
      defaultType={defaultType}
    />
  );
}

function AccountDialogContent({
  onOpenChange,
  editing,
  defaultType,
}: {
  onOpenChange: (open: boolean) => void;
  editing?: Account | null;
  defaultType?: AccountType;
}) {
  const { addAccount, updateAccount, archiveAccount } = useData();
  const [type, setType] = useState<AccountType>(
    editing?.type ?? defaultType ?? "bank",
  );
  const [name, setName] = useState(editing?.name ?? "");
  const [institution, setInstitution] = useState(editing?.institution ?? "");
  const [currency, setCurrency] = useState(editing?.currency ?? "AED");
  const [opening, setOpening] = useState(() =>
    editing
      ? String(
          editing.type === "credit_card"
            ? Math.abs(editing.openingBalance)
            : editing.openingBalance,
        )
      : "",
  );
  const [creditLimit, setCreditLimit] = useState(
    editing?.creditLimit ? String(editing.creditLimit) : "",
  );
  const [lastFour, setLastFour] = useState(editing?.lastFour ?? "");
  const [color, setColor] = useState(editing?.color ?? DEFAULT_COLOR);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const isCash = type === "cash";

  async function handleSave() {
    setError(null);
    if (!name.trim()) {
      setError(isCash ? "Name the cash source." : "Give this account a name.");
      return;
    }

    const openingNumber = Number(opening.replace(/,/g, "")) || 0;
    if (!Number.isFinite(openingNumber)) {
      setError("Enter a valid opening balance.");
      return;
    }

    const limitNumber = Number(creditLimit.replace(/,/g, "")) || 0;
    const input = {
      name: name.trim(),
      institution: institution.trim() || null,
      type,
      currency,
      openingBalance:
        type === "credit_card"
          ? roundMoney(-Math.abs(openingNumber))
          : roundMoney(openingNumber),
      creditLimit: type === "credit_card" && limitNumber > 0 ? limitNumber : null,
      color,
      icon:
        editing?.icon ??
        (type === "credit_card"
          ? "credit-card"
          : type === "cash"
            ? "banknote"
            : "landmark"),
      lastFour:
        type === "bank" || type === "credit_card"
          ? lastFour.trim() || null
          : null,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateAccount(editing.id, input);
        toast.success("Account updated");
      } else {
        await addAccount(input);
        toast.success("Account added");
      }
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not save account.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!editing) return;
    setSaving(true);
    try {
      await archiveAccount(editing.id);
      toast.success("Account archived");
      onOpenChange(false);
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : "Could not archive account.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={onOpenChange}
      title={editing ? "Edit account" : "Add account"}
      description={
        editing
          ? "Update the details or hide this account from your workspace."
          : "Add a bank account, cash source or credit card."
      }
    >
      <form
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSave();
        }}
      >
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-[rgba(148,151,169,0.1)] p-1">
          {TYPES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setType(option.value)}
              className={cn(
                "flex h-9 items-center justify-center gap-1 rounded-[9px] text-[12px] font-medium transition sm:gap-1.5 sm:text-[13px]",
                type === option.value
                  ? "bg-white text-ink shadow-[0_1px_4px_rgba(16,24,40,0.08)]"
                  : "text-muted hover:text-ink",
              )}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={isCash ? "Source of cash" : "Account name"}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={
                isCash
                  ? "e.g. Home drawer"
                  : type === "credit_card"
                    ? "e.g. FAB Credit Card"
                    : "e.g. Emirates NBD"
              }
              autoFocus
            />
          </Field>
          <Field label={isCash ? "Notes" : "Institution"} hint="optional">
            <Input
              value={institution}
              onChange={(event) => setInstitution(event.target.value)}
              placeholder={
                isCash
                  ? "e.g. Kept at home"
                  : type === "credit_card"
                    ? "e.g. FAB"
                    : "e.g. Emirates NBD"
              }
            />
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Currency"
            hint={editing ? "Fixed after creation" : "Popular currencies"}
          >
            <Select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              disabled={Boolean(editing)}
            >
              {CURRENCIES.some((item) => item.code === currency) ? null : (
                <option value={currency}>{currency}</option>
              )}
              {CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.code} — {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label={
              type === "credit_card"
                ? "Opening amount owed"
                : "Opening balance"
            }
            hint="Before tracked activity"
          >
            <Input
              value={opening}
              onChange={(event) => setOpening(event.target.value)}
              inputMode="decimal"
              placeholder="0.00"
            />
          </Field>
        </div>

        {type === "credit_card" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Credit limit" hint="optional">
              <Input
                value={creditLimit}
                onChange={(event) => setCreditLimit(event.target.value)}
                inputMode="decimal"
                placeholder="e.g. 15000"
              />
            </Field>
            <Field label="Last four digits" hint="optional">
              <Input
                value={lastFour}
                onChange={(event) =>
                  setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                inputMode="numeric"
                placeholder="1188"
                maxLength={4}
              />
            </Field>
          </div>
        ) : type === "bank" ? (
          <Field label="Last four digits" hint="optional">
            <Input
              value={lastFour}
              onChange={(event) =>
                setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              inputMode="numeric"
              placeholder="4821"
              maxLength={4}
            />
          </Field>
        ) : null}

        <Field label={type === "credit_card" ? "Card colour" : "Account colour"}>
          <ColorPicker value={color} onChange={setColor} />
        </Field>

        {error ? (
          <p className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs font-medium text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
          {editing ? (
            confirmArchive ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={handleArchive}
                  loading={saving}
                >
                  Archive
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmArchive(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-danger hover:bg-danger-soft hover:text-danger"
                onClick={() => setConfirmArchive(true)}
              >
                <Trash2 className="size-3.5" />
                Archive
              </Button>
            )
          ) : (
            <span />
          )}
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? "Save changes" : "Add account"}
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  );
}
