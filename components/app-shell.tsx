"use client";

import {
  ArrowLeftRight,
  CircleUserRound,
  LayoutDashboard,
  LogOut,
  PieChart,
  Plus,
  ReceiptText,
  Settings,
  TriangleAlert,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccountSelection } from "@/lib/account-selection";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { initials, cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { QuickAddProvider, useQuickAdd } from "@/components/quick-add";
import { Skeleton } from "@/components/ui/skeleton";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileItems = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/transactions", label: "Activity", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/accounts", label: "Accounts", icon: Wallet },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <QuickAddProvider>
      <Shell>{children}</Shell>
    </QuickAddProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { profile, ready, error } = useData();
  const { activeAccounts } = useAccountSelection();
  const { openTransaction } = useQuickAdd();

  if (loading) return <Splash />;
  if (!user) return <Splash />;

  const name = profile.fullName || user.name;
  const current = navItems.find((item) => item.href === pathname);
  const accountLabel =
    activeAccounts.length === 0
      ? "No accounts"
      : `${activeAccounts.length} account${activeAccounts.length === 1 ? "" : "s"}`;

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line-soft bg-white lg:flex">
        <div className="px-5 pb-5 pt-6">
          <Link
            href="/"
            className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <Logo />
          </Link>
        </div>

        <div className="px-3">
          <button
            type="button"
            onClick={() => openTransaction()}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white shadow-[0_1px_2px_rgba(16,24,40,0.06)] transition hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
          >
            <Plus className="size-4" />
            Add transaction
          </button>
        </div>

        <div className="mt-6 flex-1 px-3">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-subtle">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-10 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition",
                    active
                      ? "bg-brand-soft text-brand-dark"
                      : "text-muted hover:bg-canvas hover:text-ink",
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4",
                      active ? "text-brand" : "text-subtle group-hover:text-muted",
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="m-3 rounded-2xl border border-line-soft bg-canvas p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
              {initials(name) || <CircleUserRound className="size-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
              <p className="truncate text-[11px] text-subtle">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="flex size-8 items-center justify-center rounded-lg text-subtle transition hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line-soft pt-2.5">
            <span className="shrink-0 text-[11px] text-subtle">Accounts</span>
            <span className="truncate rounded-md bg-white px-1.5 py-0.5 text-[11px] font-semibold text-ink">
              {accountLabel}
            </span>
          </div>
          {user.isDemo ? (
            <div className="mt-2">
              <Badge variant="brand" className="w-full justify-center">
                Demo workspace
              </Badge>
            </div>
          ) : null}
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line-soft bg-canvas/85 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/" aria-label="AshariBook home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          {user.isDemo ? (
            <Badge variant="brand" className="hidden sm:inline-flex">
              Demo
            </Badge>
          ) : null}
          <span className="rounded-lg border border-line-soft bg-white px-2 py-1 text-[11px] font-semibold text-muted">
            {accountLabel}
          </span>
          <Link
            href="/settings"
            className="flex size-9 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            aria-label="Settings"
          >
            {initials(name) || <CircleUserRound className="size-4" />}
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
        {error ? (
          <div className="mb-5 flex items-start gap-2 rounded-xl border border-danger/15 bg-danger-soft px-4 py-3 text-xs text-danger">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        ) : null}
        {!ready ? <PageLoading title={current?.label} /> : null}
        <div key={pathname} className={cn("animate-in", !ready && "hidden")}>
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line-soft bg-white/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
          {mobileItems.slice(0, 2).map((item) => (
            <MobileNavItem key={item.href} item={item} pathname={pathname} />
          ))}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => openTransaction()}
              className="-mt-6 flex size-14 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgba(113,50,245,0.32)] transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20"
              aria-label="Add transaction"
            >
              <Plus className="size-6" />
            </button>
          </div>
          {mobileItems.slice(2).map((item) => (
            <MobileNavItem key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function MobileNavItem({
  item,
  pathname,
}: {
  item: (typeof mobileItems)[number];
  pathname: string;
}) {
  const active =
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition",
        active ? "text-brand" : "text-subtle",
      )}
    >
      <item.icon className="size-[18px]" strokeWidth={active ? 2.2 : 1.9} />
      {item.label}
    </Link>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas">
      <Logo />
      <div className="h-1 w-28 overflow-hidden rounded-full bg-line-soft">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
      </div>
    </div>
  );
}

function PageLoading({ title }: { title?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
          Loading
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-[-0.035em]">
          {title ?? "Overview"}
        </h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
