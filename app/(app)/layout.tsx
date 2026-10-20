import { AppShell } from "@/components/app-shell";

// The dashboard is a client-rendered workspace. Opt out of instant-navigation
// validation until request-time data is migrated into the server shell.
export const instant = false;

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
