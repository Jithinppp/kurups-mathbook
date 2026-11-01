import "react-native-gesture-handler";
import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AccountSelectionProvider } from "@/contexts/account-selection";
import { AuthProvider } from "@/contexts/auth";
import { DataProvider } from "@/contexts/data";
import { ToastProvider } from "@/contexts/toast";
import { colors } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DataProvider>
          <AccountSelectionProvider>
            <ToastProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.canvas },
                }}
              >
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="onboarding-account" />
                <Stack.Screen name="auth/callback" />
              </Stack>
            </ToastProvider>
          </AccountSelectionProvider>
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
