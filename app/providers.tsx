"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth-context";
import { DataProvider } from "@/lib/data-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DataProvider>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#ffffff",
              color: "#101114",
              border: "1px solid #ececf2",
              borderRadius: "14px",
              boxShadow: "0 12px 40px rgba(16,17,20,0.08)",
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "14px",
            },
          }}
        />
      </DataProvider>
    </AuthProvider>
  );
}
