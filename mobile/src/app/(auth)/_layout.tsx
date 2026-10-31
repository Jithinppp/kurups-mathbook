import { Redirect, Stack, usePathname } from "expo-router";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { useAuth } from "@/contexts/auth";
import { colors } from "@/lib/theme";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  // A recovery link creates a short-lived session. Keep the reset screen
  // reachable while that session exists; every other auth screen redirects
  // signed-in users back to the workspace.
  if (user && pathname !== "/reset-password") return <Redirect href="/" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.canvas,
  },
});
