import { Pressable, StyleSheet, Text, View } from "react-native";
import type { AccountWithBalance } from "@asharibook/shared";
import { CreditCard } from "lucide-react-native";

import { AppIcon } from "@/components/ui/app-icon";
import { Money } from "@/components/ui/money";
import { ProgressBar } from "@/components/ui/progress";
import { colors, font, radius } from "@/lib/theme";

export function AccountCard({
  account,
  selected = false,
  onPress,
  onLongPress,
}: {
  account: AccountWithBalance;
  selected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const isCard = account.type === "credit_card";
  const debt = Math.max(0, -account.balance);
  const utilization = account.creditLimit
    ? Math.min(100, (debt / account.creditLimit) * 100)
    : 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${account.name}, ${account.currency}`}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.card,
        isCard ? { backgroundColor: account.color } : styles.lightCard,
        selected && styles.selected,
        pressed && { opacity: 0.88 },
      ]}
    >
      {isCard ? (
        <>
          <View style={styles.ringLarge} />
          <View style={styles.ringSmall} />
          <View style={styles.cardTop}>
            <View style={styles.cardIdentity}>
              <View style={styles.cardIcon}>
                <AppIcon name={account.icon} color={colors.white} size={16} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {account.name}
                </Text>
                <Text style={styles.cardMeta} numberOfLines={1}>
                  {account.institution ?? "Credit card"}
                </Text>
              </View>
            </View>
            <CreditCard color="rgba(255,255,255,0.6)" size={18} />
          </View>
          <View>
            <Text style={styles.cardLabel}>
              {account.balance > 0 ? "Credit balance" : "Outstanding"}
            </Text>
            <Money
              value={account.balance > 0 ? account.balance : debt}
              currency={account.currency}
              size={22}
              color={colors.white}
            />
          </View>
          <View style={styles.cardBottom}>
            <View style={styles.cardRow}>
              <Text style={styles.cardSmall}>
                {account.creditLimit ? "Credit used" : "No limit set"}
              </Text>
              <Text style={styles.cardSmall}>
                {account.creditLimit ? `${Math.round(utilization)}%` : "—"}
              </Text>
            </View>
            <ProgressBar
              value={utilization}
              color={utilization > 80 ? "#ffb4a8" : colors.white}
              track="rgba(255,255,255,0.22)"
              height={5}
            />
            <View style={styles.cardRow}>
              <Text style={styles.cardSmall}>•••• {account.lastFour ?? "••••"}</Text>
              {account.creditLimit ? (
                <Text style={styles.cardSmall}>
                  {formatLimit(account.creditLimit)} {account.currency} limit
                </Text>
              ) : null}
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.cardTop}>
            <View style={[styles.lightIcon, { backgroundColor: `${account.color}16` }]}>
              <AppIcon name={account.icon} color={account.color} size={18} />
            </View>
            <View style={styles.lightBadge}>
              <Text style={styles.lightBadgeText}>
                {account.type === "cash" ? "Cash" : "Bank"}
              </Text>
            </View>
          </View>
          <View>
            <Text style={styles.lightName} numberOfLines={1}>
              {account.name}
            </Text>
            <Text style={styles.lightMeta} numberOfLines={1}>
              {account.institution ??
                (account.type === "cash" ? "Cash source" : "Personal account")}
              {account.lastFour ? ` · •••• ${account.lastFour}` : ""}
            </Text>
          </View>
          <View>
            <Text style={styles.lightLabel}>Balance</Text>
            <Money
              value={account.balance}
              currency={account.currency}
              size={21}
              color={account.balance < 0 ? colors.danger : colors.ink}
            />
          </View>
          {selected ? <Text style={styles.selectedLabel}>Selected</Text> : null}
        </>
      )}
    </Pressable>
  );
}

function formatLimit(value: number) {
  return new Intl.NumberFormat("en-AE").format(value);
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 178,
    borderRadius: radius.xl,
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  lightCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  selected: { borderColor: colors.brand, borderWidth: 1.5 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  cardIdentity: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  cardName: { fontFamily: font.semibold, fontSize: 12, color: colors.white },
  cardMeta: { fontFamily: font.regular, fontSize: 9, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  cardLabel: {
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.62)",
    marginBottom: 3,
  },
  cardBottom: { gap: 4 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardSmall: { fontFamily: font.regular, fontSize: 9, color: "rgba(255,255,255,0.65)" },
  ringLarge: {
    position: "absolute",
    right: -40,
    top: -48,
    width: 176,
    height: 176,
    borderRadius: 88,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  ringSmall: {
    position: "absolute",
    right: -8,
    top: 8,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  lightIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  lightBadge: { borderRadius: 7, backgroundColor: colors.canvas, paddingHorizontal: 7, paddingVertical: 4 },
  lightBadgeText: {
    fontFamily: font.semibold,
    fontSize: 9,
    letterSpacing: 0.7,
    color: colors.subtle,
    textTransform: "uppercase",
  },
  lightName: { fontFamily: font.semibold, fontSize: 13, color: colors.ink },
  lightMeta: { marginTop: 2, fontFamily: font.regular, fontSize: 10, color: colors.subtle },
  lightLabel: {
    fontFamily: font.medium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.subtle,
    marginBottom: 2,
  },
  selectedLabel: {
    position: "absolute",
    right: 14,
    bottom: 14,
    fontFamily: font.semibold,
    fontSize: 9,
    color: colors.brand,
  },
});
