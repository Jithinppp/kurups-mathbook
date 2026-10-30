import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Banknote, Check, CreditCard, Landmark } from "lucide-react-native";
import {
  CURRENCIES,
  DEFAULT_COLOR,
  currencyLabel,
  roundMoney,
  type Account,
  type AccountInput,
  type AccountType,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Field, Input } from "@/components/ui/input";
import { FormShell } from "@/components/ui/form-shell";
import { Segmented } from "@/components/ui/segmented";
import { SelectRow } from "@/components/ui/select-row";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

const TYPES: { value: AccountType; label: string; icon: React.ReactNode }[] = [
  { value: "bank", label: "Bank", icon: <Landmark color={colors.muted} size={14} /> },
  { value: "cash", label: "Cash", icon: <Banknote color={colors.muted} size={14} /> },
  {
    value: "credit_card",
    label: "Credit card",
    icon: <CreditCard color={colors.muted} size={14} />,
  },
];

export function AccountForm({ editing }: { editing?: Account | null }) {
  const router = useRouter();
  const { addAccount, updateAccount, archiveAccount } = useData();
  const { setSelectedAccountId } = useAccountSelection();
  const { showToast } = useToast();

  const [type, setType] = useState<AccountType>(editing?.type ?? "bank");
  const [name, setName] = useState(editing?.name ?? "");
  const [institution, setInstitution] = useState(editing?.institution ?? "");
  const [currency, setCurrency] = useState(editing?.currency ?? "AED");
  const [opening, setOpening] = useState(
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
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isCash = type === "cash";
  const isCard = type === "credit_card";

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
    const input: AccountInput = {
      name: name.trim(),
      institution: institution.trim() || null,
      type,
      currency,
      openingBalance: isCard
        ? roundMoney(-Math.abs(openingNumber))
        : roundMoney(openingNumber),
      creditLimit: isCard && limitNumber > 0 ? limitNumber : null,
      color,
      icon: editing?.icon ?? (isCard ? "credit-card" : isCash ? "banknote" : "landmark"),
      lastFour:
        type === "bank" || isCard ? lastFour.trim() || null : null,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateAccount(editing.id, input);
        showToast("Account updated");
      } else {
        const account = await addAccount(input);
        setSelectedAccountId(account.id);
        showToast("Account added");
      }
      router.back();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save account.");
    } finally {
      setSaving(false);
    }
  }

  function confirmArchive() {
    if (!editing) return;
    Alert.alert(
      `Archive ${editing.name}?`,
      "Its transactions and budgets stay intact. You can restore it from the Accounts tab.",
      [
        { text: "Keep active", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await archiveAccount(editing.id);
              showToast("Account archived");
              router.back();
            } catch (caught) {
              setError(
                caught instanceof Error ? caught.message : "Could not archive account.",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  }

  return (
    <FormShell
      title={editing ? "Edit account" : "New account"}
      subtitle={editing ? editing.currency : "Bank, cash or credit card"}
      onCancel={() => router.back()}
      onSave={handleSave}
      saveLabel={editing ? "Save" : "Add"}
      saving={saving}
      error={error}
      footer={
        editing ? (
          <Button label="Archive account" variant="danger" onPress={confirmArchive} />
        ) : null
      }
    >
      <Segmented options={TYPES} value={type} onChange={setType} />

      <Field label={isCash ? "Source of cash" : "Account name"}>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={
            isCash
              ? "e.g. Home drawer"
              : isCard
                ? "e.g. FAB Credit Card"
                : "e.g. Emirates NBD"
          }
          autoCapitalize="words"
          autoFocus={!editing}
          returnKeyType="done"
          onSubmitEditing={() => void handleSave()}
        />
      </Field>

      <Field label={isCash ? "Notes" : "Institution"} hint="optional">
        <Input
          value={institution}
          onChangeText={setInstitution}
          placeholder={
            isCash ? "e.g. Kept at home" : isCard ? "e.g. FAB" : "e.g. Emirates NBD"
          }
          returnKeyType="done"
          onSubmitEditing={() => void handleSave()}
        />
      </Field>

      <SelectRow
        label="Currency"
        value={`${currency} — ${currencyLabel(currency)}`}
        placeholder="Choose currency"
        onPress={() => setCurrencyOpen(true)}
        hint={editing ? "fixed after creation" : "no conversion"}
        disabled={Boolean(editing)}
      />

      <Field
        label={isCard ? "Opening amount owed" : "Opening balance"}
        hint="before tracked activity"
      >
        <Input
          value={opening}
          onChangeText={setOpening}
          placeholder="0.00"
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={() => void handleSave()}
        />
      </Field>

      {isCard ? (
        <>
          <Field label="Credit limit" hint="optional">
            <Input
              value={creditLimit}
              onChangeText={setCreditLimit}
              placeholder="e.g. 15000"
              keyboardType="decimal-pad"
              returnKeyType="done"
              onSubmitEditing={() => void handleSave()}
            />
          </Field>
          <Field label="Last four digits" hint="optional">
            <Input
              value={lastFour}
              onChangeText={(value) =>
                setLastFour(value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="1188"
              keyboardType="number-pad"
              maxLength={4}
              returnKeyType="done"
              onSubmitEditing={() => void handleSave()}
            />
          </Field>
        </>
      ) : type === "bank" ? (
        <Field label="Last four digits" hint="optional">
          <Input
            value={lastFour}
            onChangeText={(value) =>
              setLastFour(value.replace(/\D/g, "").slice(0, 4))
            }
            placeholder="4821"
            keyboardType="number-pad"
            maxLength={4}
            returnKeyType="done"
            onSubmitEditing={() => void handleSave()}
          />
        </Field>
      ) : null}

      <Field label={isCard ? "Card colour" : "Account colour"}>
        <ColorPicker value={color} onChange={setColor} />
      </Field>

      <Text style={styles.note}>
        Currency stays fixed after creation. Transfers only work between accounts
        with the same native currency.
      </Text>

      <Sheet
        visible={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        title="Choose currency"
        description="Accounts keep their native currency. AshariBook never converts."
      >
        <View style={styles.currencyList}>
          {CURRENCIES.map((item) => (
            <Pressable
              key={item.code}
              onPress={() => {
                setCurrency(item.code);
                setCurrencyOpen(false);
              }}
              style={[
                styles.currencyOption,
                item.code === currency && styles.currencyOptionActive,
              ]}
            >
              <View style={styles.currencyBadge}>
                <Text style={styles.currencyCode}>{item.code}</Text>
              </View>
              <Text style={styles.currencyLabel}>{item.label}</Text>
              {item.code === currency ? (
                <Check color={colors.brand} size={16} />
              ) : null}
            </Pressable>
          ))}
        </View>
      </Sheet>
    </FormShell>
  );
}

const styles = StyleSheet.create({
  note: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.subtle,
    textAlign: "center",
  },
  currencyList: { gap: 6, paddingBottom: 8 },
  currencyOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    paddingHorizontal: 12,
  },
  currencyOptionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  currencyBadge: {
    width: 42,
    borderRadius: 8,
    backgroundColor: colors.canvas,
    paddingVertical: 5,
    alignItems: "center",
  },
  currencyCode: { fontFamily: font.semibold, fontSize: 9, color: colors.ink },
  currencyLabel: { flex: 1, fontFamily: font.medium, fontSize: 12, color: colors.ink },
});
