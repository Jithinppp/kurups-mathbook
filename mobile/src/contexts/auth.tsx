import * as Linking from "expo-linking";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AppState } from "react-native";
import type { AppUser } from "@asharibook/shared";

import {
  clearCachedWorkspace,
  clearDemoUser,
  DEMO_USER,
  loadDemoUser,
  saveDemoUser,
} from "@/lib/storage";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean }>;
  requestPasswordReset: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  enterDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function userFromSession(session: {
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> };
} | null): AppUser | null {
  if (!session?.user) return null;
  const email = session.user.email ?? "";
  const metadataName =
    typeof session.user.user_metadata?.full_name === "string"
      ? session.user.user_metadata.full_name
      : typeof session.user.user_metadata?.name === "string"
        ? session.user.user_metadata.name
        : "";
  return {
    id: session.user.id,
    email,
    name: metadataName || email.split("@")[0] || "You",
    isDemo: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const demoActive = useRef(false);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      const demo = await loadDemoUser();
      if (demo) {
        demoActive.current = true;
        if (active) {
          setUser(demo);
          setLoading(false);
        }
        return;
      }

      if (!supabase) {
        if (active) setLoading(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setUser(userFromSession(data.session));
      setLoading(false);
    }

    void hydrate();

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      if (demoActive.current) return;
      setUser(userFromSession(session));
      setLoading(false);
    });

    return () => {
      active = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });
    return () => subscription.remove();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    demoActive.current = false;
    await clearDemoUser();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    setUser(userFromSession(data.session));
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      if (!supabase) throw new Error("Supabase is not configured.");
      demoActive.current = false;
      await clearDemoUser();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: Linking.createURL("auth/callback"),
        },
      });
      if (error) throw new Error(error.message);
      if (data.session) setUser(userFromSession(data.session));
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL("auth/callback"),
    });
    if (error) throw new Error(error.message);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: Linking.createURL("auth/callback") },
    });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    demoActive.current = false;
    await clearDemoUser();
    if (user?.id && !user.isDemo) {
      await clearCachedWorkspace(user.id).catch(() => undefined);
    }
    if (supabase) {
      await supabase.auth.signOut().catch(() => undefined);
    }
    setUser(null);
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw new Error(error.message);
    await signOut();
  }, [signOut]);

  const enterDemo = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    }
    demoActive.current = true;
    await saveDemoUser(DEMO_USER);
    setUser(DEMO_USER);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: isSupabaseConfigured,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      resendConfirmation,
      signOut,
      deleteAccount,
      enterDemo,
    }),
    [
      user,
      loading,
      signIn,
      signUp,
      requestPasswordReset,
      updatePassword,
      resendConfirmation,
      signOut,
      deleteAccount,
      enterDemo,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
