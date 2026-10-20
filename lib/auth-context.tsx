"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./supabase/client";
import type { AppUser } from "./types";

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
  signOut: () => Promise<void>;
  enterDemo: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_COOKIE = "kurup-demo";
const DEMO_USER_KEY = "kurup.demo.user";
const DEMO_USER: AppUser = {
  id: "demo-user",
  email: "jithin@kurup.app",
  name: "Jithin",
  isDemo: true,
};

function setDemoCookie(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${DEMO_COOKIE}=${enabled ? "1" : ""}; path=/; max-age=${
    enabled ? 60 * 60 * 24 * 30 : 0
  }; samesite=lax`;
}

function hasDemoCookie() {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((value) => value.trim() === `${DEMO_COOKIE}=1`);
}

function appUserFromSupabase(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): AppUser {
  const name =
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email?.split("@")[0] ||
    "You";

  return {
    id: user.id,
    email: user.email ?? "",
    name,
    isDemo: false,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateDemo = async () => {
      await Promise.resolve();
      // The cookie is the session, in configured or local-only builds.
      // Recreate the local marker if the user cleared storage.
      window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(DEMO_USER));
      setUser(DEMO_USER);
      setLoading(false);
    };

    if (hasDemoCookie()) {
      void hydrateDemo();
      return;
    }

    const supabase = getSupabaseBrowserClient();

    if (configured && supabase) {
      let active = true;

      const hydrate = async () => {
        const { data } = await supabase.auth.getUser();
        if (!active || hasDemoCookie()) return;
        setUser(data.user ? appUserFromSupabase(data.user) : null);
        setLoading(false);
      };

      void hydrate();

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (hasDemoCookie()) return;
        setUser(session?.user ? appUserFromSupabase(session.user) : null);
        setLoading(false);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
      };
    }

    const finishLoading = async () => {
      await Promise.resolve();
      setLoading(false);
    };

    void finishLoading();
  }, [configured]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      if (data.user) setUser(appUserFromSupabase(data.user));
    },
    [],
  );

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo:
            typeof window !== "undefined"
              ? `${window.location.origin}/auth/callback`
              : undefined,
        },
      });
      if (error) throw new Error(error.message);
      if (data.session?.user) setUser(appUserFromSupabase(data.session.user));
      return { needsConfirmation: !data.session };
    },
    [],
  );

  const signOut = useCallback(async () => {
    setDemoCookie(false);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DEMO_USER_KEY);
    }
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    // A full reload clears any preserved auth-page state and stale errors.
    window.location.replace(`${window.location.origin}/login`);
  }, []);

  const enterDemo = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DEMO_USER_KEY, JSON.stringify(DEMO_USER));
    }
    setDemoCookie(true);
    setLoading(false);
    setUser(DEMO_USER);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      signIn,
      signUp,
      signOut,
      enterDemo,
    }),
    [user, loading, configured, signIn, signUp, signOut, enterDemo],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
