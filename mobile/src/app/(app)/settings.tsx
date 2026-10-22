import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Check,
  Database,
  LogOut,
  Plus,
  RefreshCcw,
  ShieldCheck,
  User,
} from "lucide-react-native";
import { initials, type CategoryKind } from "@asharibook/shared";

import { useAuth } from "@/contexts/auth";
import { useData } from "@/contexts/data";
import { useToast } from "@/contexts/toast";
import { AppIcon } from "@/components/ui/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { Segmented } from "@/components/ui/segmented";
import { Sheet } from "@/components/ui/sheet";
import { colors, font, radius } from "@/lib/theme";

const CATEGORY_ICONS = [
  "shopping-cart",
  "utensils",
  "car",
  "shopping-bag",
  "zap",
  "home",
  "users",
  "graduation-cap",
  "heart-pulse",
  "clapperboard",
  "plane",
  "repeat",
  "file-text",
  "more-horizontal",
  "briefcase",
  "wallet",
  "undo-2",
  "gift",
  "coffee",
  "fuel",
  "dumbbell",
  "smartphone",
];

const CATEGORY_COLORS = [
  "#7132f5",
  "#5b1ecf",
  "#101114",
  "#149e61",
  "#0e7490",
  "#b45309",
  "#be123c",
  "#686b82",
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut, configured } = useAuth();
  const {
    profile,
    accounts,
    categories,
    transactions,
    budgets,
    updateProfile,
    resetDemo,
    addCategory,
    refresh,
  } = useData();
  const { showToast } = useToast();
  const [name, setName] = useState(profile.fullName);
  const [savingName, setSavingName] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryKind, setCategoryKind] = useState<CategoryKind>("expense");
  const [categoryIcon, setCategoryIcon] = useState(CATEGORY_ICONS[0]);
  const [categoryColor, setCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [savingCategory, setSavingCategory] = useState(false);

  async function saveName() {
    if (!name.trim()) {
      showToast("Enter your name", "error");
      return;
    }
    setSavingName(true);
    try {
      await updateProfile(name.trim());
      showToast("Profile updated");
    } catch (caught) {
      showToast(
        caught instanceof Error ? caught.message : "Could not update profile.",
        "error",
      );
    } finally {
      setSavingName(false);
    }
  }

  async function saveCategory() {
    setCategoryError(null);
    if (!categoryName.trim()) {
      setCategoryError("Give the category a name.");
      return;
    }
    setSavingCategory(true);
    try {
      await addCategory({
        name: categoryName.trim(),
        kind: categoryKind,
        icon: categoryIcon,
        color: categoryColor,
      });
      showToast("Category added");
      setCategoryOpen(false);
      setCategoryName("");
      setCategoryKind("expense");
      setCategoryIcon(CATEGORY_ICONS[0]);
      setCategoryColor(CATEGORY_COLORS[0]);
    } catch (caught) {
      setCategoryError(
        caught instanceof Error ? caught.message : "Could not add category.",
      );
    } finally {
      setSavingCategory(false);
    }
  }

  function confirmReset() {
    Alert.alert(
      "Reset demo data?",
      "The sample accounts, transactions and budgets will be recreated. Any demo edits you made will be lost.",
      [
        { text: "Keep my data", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await resetDemo();
              showToast("Demo data reset");
            } catch (caught) {
              showToast(
                caught instanceof Error ? caught.message : "Could not reset demo.",
                "error",
              );
            }
          },
        },
      ],
    );
  }

  function confirmSignOut() {
    Alert.alert(
      user?.isDemo ? "Leave the demo?" : "Sign out?",
      user?.isDemo
        ? "You can reopen the demo from the sign-in screen anytime."
        : "You will need your email and password to sign back in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: user?.isDemo ? "Leave" : "Sign out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            router.replace("/login");
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.back}
        >
          <ArrowLeft color={colors.muted} size={19} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {initials(profile.fullName || user?.name || "You") || "A"}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.profileName} numberOfLines={1}>
                {profile.fullName || user?.name || "You"}
              </Text>
              <Text style={styles.profileEmail} numberOfLines={1}>
                {user?.email ?? "Demo workspace"}
              </Text>
            </View>
            <Badge tone={user?.isDemo ? "warning" : "success"}>
              {user?.isDemo ? "Demo" : "Live"}
            </Badge>
          </View>

          <Field label="Display name">
            <View style={styles.nameRow}>
              <User color={colors.subtle} size={16} />
              <Input
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                style={styles.nameInput}
              />
            </View>
          </Field>
          <Button
            label="Save name"
            size="sm"
            variant="secondary"
            onPress={saveName}
            loading={savingName}
          />
        </Card>

        <View style={styles.stats}>
          <Stat label="Accounts" value={accounts.filter((account) => !account.isArchived).length} />
          <Stat label="Transactions" value={transactions.length} />
          <Stat label="Budgets" value={budgets.length} />
        </View>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Categories</Text>
              <Text style={styles.sectionDescription}>
                Shared across every account you own.
              </Text>
            </View>
            <Button
              label="Add"
              size="sm"
              variant="secondary"
              icon={<Plus color={colors.ink} size={14} />}
              onPress={() => setCategoryOpen(true)}
            />
          </View>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryChip}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: `${category.color}16` },
                  ]}
                >
                  <AppIcon name={category.icon} color={category.color} size={15} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.name}
                  </Text>
                  <Text style={styles.categoryKind}>{category.kind}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Data & account</Text>
              <Text style={styles.sectionDescription}>
                {user?.isDemo
                  ? "This workspace is stored locally on this device."
                  : "Your ledger syncs with Supabase. RLS keeps it private."}
              </Text>
            </View>
            {user?.isDemo ? (
              <Database color={colors.warning} size={18} />
            ) : (
              <ShieldCheck color={colors.success} size={18} />
            )}
          </View>
          {!configured ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                Supabase is not configured in this build. The demo remains fully
                usable offline.
              </Text>
            </View>
          ) : null}
          {user?.isDemo ? (
            <>
              <Button
                label="Reset demo data"
                variant="secondary"
                icon={<RefreshCcw color={colors.ink} size={15} />}
                onPress={confirmReset}
              />
              {configured ? (
                <Button
                  label="Sign in to a live workspace"
                  variant="secondary"
                  icon={<User color={colors.ink} size={15} />}
                  onPress={() => {
                    void signOut();
                    router.replace("/login");
                  }}
                />
              ) : null}
            </>
          ) : (
            <Button
              label="Refresh from cloud"
              variant="secondary"
              icon={<RefreshCcw color={colors.ink} size={15} />}
              onPress={() => {
                refresh();
                showToast("Refreshing from cloud");
              }}
            />
          )}
          <Button
            label={user?.isDemo ? "Leave demo" : "Sign out"}
            variant="danger"
            icon={<LogOut color={colors.danger} size={15} />}
            onPress={confirmSignOut}
          />
        </Card>

        <View style={styles.brandCard}>
          <Logo />
          <Text style={styles.brandText}>
            Account-first personal finance. Native currencies, calm budgets and a
            clear monthly ledger.
          </Text>
          <Text style={styles.version}>Version 1.0.0 · mobile</Text>
        </View>

        <Text style={styles.footer}>
          AshariBook never converts between currencies. One account, one currency,
          one honest view at a time.
        </Text>
      </ScrollView>

      <Sheet
        visible={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        title="New category"
        description="Use it for expenses or income. It will be available on every account."
      >
        <View style={styles.sheetBody}>
          {categoryError ? (
            <View style={styles.categoryError}>
              <Text style={styles.categoryErrorText}>{categoryError}</Text>
            </View>
          ) : null}
          <Field label="Name">
            <Input
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g. Pets"
              autoCapitalize="words"
              autoFocus
            />
          </Field>
          <Field label="Type">
            <Segmented
              options={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
              ]}
              value={categoryKind}
              onChange={setCategoryKind}
            />
          </Field>
          <Field label="Icon">
            <View style={styles.iconGrid}>
              {CATEGORY_ICONS.map((icon) => (
                <Pressable
                  key={icon}
                  onPress={() => setCategoryIcon(icon)}
                  style={[
                    styles.iconOption,
                    categoryIcon === icon && styles.iconOptionActive,
                  ]}
                >
                  <AppIcon
                    name={icon}
                    color={categoryIcon === icon ? colors.brand : colors.muted}
                    size={17}
                  />
                </Pressable>
              ))}
            </View>
          </Field>
          <Field label="Colour">
            <View style={styles.colorRow}>
              {CATEGORY_COLORS.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setCategoryColor(color)}
                  style={[styles.color, { backgroundColor: color }]}
                >
                  {categoryColor === color ? (
                    <Check color={colors.white} size={13} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </Field>
          <Button label="Add category" onPress={saveCategory} loading={savingCategory} />
        </View>
      </Sheet>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
    backgroundColor: colors.canvas,
  },
  back: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: font.semibold, fontSize: 16, color: colors.ink },
  headerSpacer: { width: 38 },
  scroll: { padding: 18, gap: 14, paddingBottom: 40 },
  profileCard: { gap: 14, padding: 16 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: font.semibold, fontSize: 17, color: colors.white },
  profileName: { fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  profileEmail: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingLeft: 12,
  },
  nameInput: { flex: 1, borderWidth: 0, minHeight: 44, paddingLeft: 0 },
  stats: { flexDirection: "row", gap: 9 },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    paddingVertical: 12,
  },
  statValue: { fontFamily: font.semibold, fontSize: 17, color: colors.ink },
  statLabel: { fontFamily: font.medium, fontSize: 9, color: colors.subtle },
  sectionCard: { gap: 12, padding: 16 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  sectionTitle: { fontFamily: font.semibold, fontSize: 14, color: colors.ink },
  sectionDescription: {
    marginTop: 2,
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.subtle,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  categoryChip: {
    width: "48.8%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    padding: 8,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: { fontFamily: font.medium, fontSize: 10, color: colors.ink },
  categoryKind: {
    marginTop: 1,
    fontFamily: font.regular,
    fontSize: 8,
    color: colors.subtle,
    textTransform: "capitalize",
  },
  notice: {
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
    padding: 11,
  },
  noticeText: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 15,
    color: colors.warning,
  },
  brandCard: {
    alignItems: "center",
    gap: 9,
    borderRadius: radius.xl,
    backgroundColor: colors.brandSoft,
    padding: 20,
  },
  brandText: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.muted,
    textAlign: "center",
  },
  version: { fontFamily: font.medium, fontSize: 9, color: colors.subtle },
  footer: {
    fontFamily: font.regular,
    fontSize: 10,
    lineHeight: 16,
    color: colors.subtle,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  sheetBody: { gap: 14, paddingBottom: 8 },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  iconOption: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  iconOptionActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  color: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryError: {
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
    padding: 10,
  },
  categoryErrorText: { fontFamily: font.medium, fontSize: 10, color: colors.danger },
});
