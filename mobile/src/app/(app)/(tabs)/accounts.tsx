import { useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Archive,
  ChevronRight,
  CreditCard,
  Plus,
  RotateCcw,
  WalletCards,
} from "lucide-react-native";
import {
  accountBalances,
  ACCOUNT_TYPE_LABEL,
  type AccountWithBalance,
} from "@asharibook/shared";

import { useAccountSelection } from "@/contexts/account-selection";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { AccountCard } from "@/components/account-card";
import { AppIcon } from "@/components/ui/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Money } from "@/components/ui/money";
import { PageHeader } from "@/components/ui/page-header";
import { colors, font, radius } from "@/lib/theme";

export default function AccountsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accounts, transactions, archiveAccount, restoreAccount, refresh } = useData();
  const { activeAccounts, selectedAccount, setSelectedAccountId } = useAccountSelection();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const all = accountBalances(accounts, transactions);
  const archived = all.filter((account) => account.isArchived);

  async function archive(account: AccountWithBalance) {
    try {
      await archiveAccount(account.id);
      showToast(`${account.name} archived`);
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not archive account.",
        "error",
      );
    }
  }

  async function restore(account: AccountWithBalance) {
    try {
      await restoreAccount(account.id);
      showToast(`${account.name} restored`);
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not restore account.",
        "error",
      );
    }
  }

  function confirmArchive(account: AccountWithBalance) {
    Alert.alert(
      `Archive ${account.name}?`,
      "Its transactions and budgets stay intact, but the account disappears from the workspace until you restore it.",
      [
        { text: "Keep active", style: "cancel" },
        {
          text: "Archive",
          style: "destructive",
          onPress: () => void archive(account),
        },
      ],
    );
  }

  function openActions(account: AccountWithBalance) {
    Alert.alert(account.name, "Manage this account", [
      {
        text: "Edit details",
        onPress: () => router.push(`/account/${account.id}`),
      },
      {
        text: "Archive",
        style: "destructive",
        onPress: () => confirmArchive(account),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function handleRefresh() {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 28 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand}
          />
        }
      >
        <PageHeader
          eyebrow="Workspace"
          title="Accounts"
          description="Every page follows the account selected here. Long press a card to manage it."
          actions={
            <Button
              label="Add"
              size="sm"
              icon={<Plus color={colors.white} size={15} />}
              onPress={() => router.push("/account/new")}
            />
          }
        />

        {activeAccounts.length ? (
          <>
            <View style={styles.summary}>
              <View style={styles.summaryIcon}>
                <WalletCards color={colors.brand} size={20} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>
                  {activeAccounts.length} active{" "}
                  {activeAccounts.length === 1 ? "account" : "accounts"}
                </Text>
                <Text style={styles.summaryText}>
                  Tap a card to switch the whole workspace. Long press to edit or archive.
                </Text>
              </View>
            </View>

            <View style={styles.grid}>
              {activeAccounts.map((account) => (
                <View key={account.id} style={styles.cell}>
                  <AccountCard
                    account={account}
                    selected={account.id === selectedAccount?.id}
                    onPress={() => setSelectedAccountId(account.id)}
                    onLongPress={() => openActions(account)}
                  />
                </View>
              ))}
            </View>

            <Card style={styles.listCard}>
              <View style={styles.listHeader}>
                <View>
                  <Text style={styles.listTitle}>Manage accounts</Text>
                  <Text style={styles.listDescription}>
                    Currencies stay native. Transfers never cross currencies.
                  </Text>
                </View>
              </View>
              {activeAccounts.map((account, index) => (
                <Pressable
                  key={account.id}
                  onPress={() => router.push(`/account/${account.id}`)}
                  style={({ pressed }) => [
                    styles.accountRow,
                    index > 0 && styles.rowDivider,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <View
                    style={[styles.accountIcon, { backgroundColor: `${account.color}16` }]}
                  >
                    <AppIcon name={account.icon} color={account.color} size={18} />
                  </View>
                  <View style={styles.accountCopy}>
                    <View style={styles.accountNameRow}>
                      <Text style={styles.accountName} numberOfLines={1}>
                        {account.name}
                      </Text>
                      {account.id === selectedAccount?.id ? (
                        <Badge tone="brand">Selected</Badge>
                      ) : null}
                    </View>
                    <Text style={styles.accountMeta}>
                      {ACCOUNT_TYPE_LABEL[account.type]} · {account.currency}
                      {account.lastFour ? ` · •••• ${account.lastFour}` : ""}
                    </Text>
                  </View>
                  <Money
                    value={account.balance}
                    currency={account.currency}
                    size={12}
                    color={account.balance < 0 ? colors.danger : colors.ink}
                    display="symbol"
                    compact
                  />
                  <ChevronRight color={colors.subtle} size={15} />
                </Pressable>
              ))}
            </Card>
          </>
        ) : (
          <EmptyState
            icon={<CreditCard color={colors.brand} size={22} />}
            title="No active accounts"
            description="Add a bank account, cash source or credit card to start tracking."
            action={
              <Button
                label="Add account"
                icon={<Plus color={colors.white} size={15} />}
                onPress={() => router.push("/account/new")}
              />
            }
          />
        )}

        {archived.length ? (
          <Card style={styles.listCard}>
            <View style={styles.listHeader}>
              <View>
                <Text style={styles.listTitle}>Archived</Text>
                <Text style={styles.listDescription}>
                  History is kept. Restore an account whenever you need it.
                </Text>
              </View>
              <Archive color={colors.subtle} size={17} />
            </View>
            {archived.map((account, index) => (
              <View
                key={account.id}
                style={[styles.archiveRow, index > 0 && styles.rowDivider]}
              >
                <View style={styles.archiveIcon}>
                  <AppIcon name={account.icon} color={colors.subtle} size={17} />
                </View>
                <View style={styles.accountCopy}>
                  <Text style={styles.archiveName} numberOfLines={1}>
                    {account.name}
                  </Text>
                  <Text style={styles.accountMeta}>
                    {ACCOUNT_TYPE_LABEL[account.type]} · {account.currency}
                  </Text>
                </View>
                <Pressable
                  onPress={() => void restore(account)}
                  style={styles.restoreButton}
                >
                  <RotateCcw color={colors.brand} size={13} />
                  <Text style={styles.restoreText}>Restore</Text>
                </Pressable>
              </View>
            ))}
          </Card>
        ) : null}

        <Text style={styles.footerNote}>
          Accounts with different currencies never convert into each other. Pick
          one at a time for a clean, honest ledger.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  scroll: { padding: 18, gap: 16 },
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.lg,
    backgroundColor: colors.brandSoft,
    padding: 14,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: { fontFamily: font.semibold, fontSize: 12, color: colors.brand },
  summaryText: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.muted,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  cell: { width: "48.6%" },
  listCard: { gap: 10, padding: 16 },
  listHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    paddingBottom: 2,
  },
  listTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  listDescription: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.subtle,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 62,
    paddingVertical: 8,
  },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.lineSoft },
  accountIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accountCopy: { flex: 1, minWidth: 0 },
  accountNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  accountName: { flexShrink: 1, fontFamily: font.semibold, fontSize: 12, color: colors.ink },
  accountMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 9, color: colors.subtle },
  archiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 58,
    paddingVertical: 8,
  },
  archiveIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.canvas,
    alignItems: "center",
    justifyContent: "center",
  },
  archiveName: { fontFamily: font.medium, fontSize: 12, color: colors.muted },
  restoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  restoreText: { fontFamily: font.semibold, fontSize: 9, color: colors.brand },
  footerNote: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.subtle,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
