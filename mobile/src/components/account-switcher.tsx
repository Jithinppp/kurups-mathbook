import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Check, ChevronDown, Plus, Settings2 } from "lucide-react-native";
import type { AccountWithBalance } from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { AppIcon } from "@/components/ui/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

export function AccountSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const router = useRouter();
  const { activeAccounts, selectedAccount, setSelectedAccountId } =
    useAccountSelection();
  const [open, setOpen] = useState(false);

  if (!selectedAccount) {
    return (
      <Pressable
        onPress={() => router.push("/account/new")}
        style={styles.emptyPill}
      >
        <Plus color={colors.brand} size={16} />
        <Text style={styles.emptyText}>Add your first account</Text>
      </Pressable>
    );
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Switch account"
        onPress={() => setOpen(true)}
        style={[styles.pill, fullWidth && styles.fullWidth]}
      >
        <View style={[styles.dot, { backgroundColor: selectedAccount.color }]}>
          <AppIcon name={selectedAccount.icon} color={colors.white} size={15} />
        </View>
        <View style={styles.pillText}>
          <Text style={styles.pillName} numberOfLines={1}>
            {selectedAccount.name}
          </Text>
          <Text style={styles.pillMeta} numberOfLines={1}>
            {selectedAccount.type === "credit_card"
              ? "Credit card"
              : selectedAccount.type === "cash"
                ? "Cash"
                : "Bank account"}{" "}
            · {selectedAccount.currency}
          </Text>
        </View>
        <ChevronDown color={colors.subtle} size={16} />
      </Pressable>

      <Sheet
        visible={open}
        onClose={() => setOpen(false)}
        title="Switch account"
        description="Every page follows the account you select here."
      >
        <View style={styles.list}>
          {activeAccounts.map((account) => (
            <AccountChoice
              key={account.id}
              account={account}
              selected={account.id === selectedAccount.id}
              onPress={() => {
                setSelectedAccountId(account.id);
                setOpen(false);
              }}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <Button
            label="Manage accounts"
            variant="secondary"
            icon={<Settings2 color={colors.ink} size={16} />}
            onPress={() => {
              setOpen(false);
              router.push("/accounts");
            }}
          />
          <Button
            label="Add account"
            icon={<Plus color={colors.white} size={16} />}
            onPress={() => {
              setOpen(false);
              router.push("/account/new");
            }}
          />
        </View>
      </Sheet>
    </>
  );
}

function AccountChoice({
  account,
  selected,
  onPress,
}: {
  account: AccountWithBalance;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={[styles.choiceIcon, { backgroundColor: `${account.color}18` }]}>
        <AppIcon name={account.icon} color={account.color} size={18} />
      </View>
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceName} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={styles.choiceMeta} numberOfLines={1}>
          {account.institution ??
            (account.type === "cash" ? "Cash source" : "Personal account")}
        </Text>
      </View>
      <View style={styles.choiceRight}>
        <Money
          value={account.balance}
          currency={account.currency}
          size={13}
          color={account.balance < 0 ? colors.danger : colors.ink}
        />
        {selected ? (
          <View style={styles.check}>
            <Check color={colors.white} size={12} />
          </View>
        ) : (
          <Badge tone="neutral">{account.currency}</Badge>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 48,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  fullWidth: { width: "100%" },
  dot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { flex: 1, minWidth: 0 },
  pillName: { fontFamily: font.semibold, fontSize: 12, color: colors.ink },
  pillMeta: { marginTop: 1, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  emptyPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  emptyText: { fontFamily: font.semibold, fontSize: 12, color: colors.brand },
  list: { gap: 8, paddingBottom: 14 },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    padding: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  choiceSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  choiceIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  choiceCopy: { flex: 1, minWidth: 0 },
  choiceName: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  choiceMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  choiceRight: { alignItems: "flex-end", gap: 5 },
  check: {
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brand,
  },
  actions: { gap: 8, paddingTop: 4 },
});
