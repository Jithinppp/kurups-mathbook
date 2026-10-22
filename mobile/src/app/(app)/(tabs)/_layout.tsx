import { Tabs, useRouter } from "expo-router";
import type { BottomTabBarProps } from "expo-router/build/layouts/Tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeftRight,
  ChartPie,
  CreditCard,
  House,
  Plus,
  type LucideIcon,
} from "lucide-react-native";

import { colors, font, shadow } from "@/lib/theme";

const TAB_ITEMS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: "index", label: "Home", icon: House },
  { name: "transactions", label: "Activity", icon: ArrowLeftRight },
  { name: "budgets", label: "Budgets", icon: ChartPie },
  { name: "accounts", label: "Accounts", icon: CreditCard },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}
      tabBar={(props) => <AppTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="transactions" options={{ title: "Activity" }} />
      <Tabs.Screen name="budgets" options={{ title: "Budgets" }} />
      <Tabs.Screen name="accounts" options={{ title: "Accounts" }} />
    </Tabs>
  );
}

function AppTabBar({ state, navigateToTab }: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const activeName = state.routes[state.index]?.name;

  const renderTab = (item: (typeof TAB_ITEMS)[number]) => {
    const route = state.routes.find((entry) => entry.name === item.name);
    if (!route) return null;
    const active = activeName === item.name;
    const Icon = item.icon;
    return (
      <Pressable
        key={item.name}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: active }}
        onPress={() => {
          if (!active) navigateToTab(route.key);
        }}
        style={styles.tab}
      >
        <Icon color={active ? colors.brand : colors.subtle} size={20} strokeWidth={active ? 2.2 : 1.8} />
        <Text style={[styles.label, active && styles.labelActive]}>{item.label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.row}>
        {TAB_ITEMS.slice(0, 2).map(renderTab)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add transaction"
          onPress={() => router.push("/transaction/new")}
          style={styles.add}
        >
          <Plus color={colors.white} size={24} strokeWidth={2.2} />
        </Pressable>
        {TAB_ITEMS.slice(2).map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.lineSoft,
    ...shadow.card,
  },
  row: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  label: { fontFamily: font.medium, fontSize: 9, color: colors.subtle },
  labelActive: { color: colors.brand, fontFamily: font.semibold },
  add: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    marginHorizontal: 4,
    borderWidth: 4,
    borderColor: colors.surface,
    ...shadow.card,
    elevation: 5,
  },
});
