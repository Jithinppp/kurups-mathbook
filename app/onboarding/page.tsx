"use client";

import {
  ArrowRight,
  Banknote,
  Check,
  CreditCard,
  Landmark,
  LogOut,
  PieChart,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccountDialog } from "@/components/accounts/account-dialog";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import type { AccountType } from "@/lib/types";
import { cn } from "@/lib/utils";

const TYPES: {
  value: AccountType;
  label: string;
  description: string;
  icon: typeof Landmark;
}[] = [
  {
    value: "bank",
    label: "Bank account",
    description: "Salary, savings or a current account.",
    icon: Landmark,
  },
  {
    value: "cash",
    label: "Cash",
    description: "Wallet, drawer or money you hold.",
    icon: Banknote,
  },
  {
    value: "credit_card",
    label: "Credit card",
    description: "Track what you owe and your limit.",
    icon: CreditCard,
  },
];

const FEATURES = [
  {
    icon: ReceiptText,
    title: "Record spending in seconds",
    description: "Every transaction stays attached to the account it came from.",
  },
  {
    icon: PieChart,
    title: "Budget without mixing currencies",
    description: "AED stays AED. INR stays INR. Nothing is silently converted.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description: "Your workspace is isolated with Supabase row-level security.",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { accounts, ready, error, refresh } = useData();
  const [type, setType] = useState<AccountType>("bank");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?next=/onboarding");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user && ready && accounts.length > 0) router.replace("/");
  }, [user, ready, accounts.length, router]);

  if (authLoading || (user && !ready)) return <OnboardingSplash />;
  if (!user) return <OnboardingSplash />;
  if (ready && accounts.length > 0) return <OnboardingSplash />;

  const selected = TYPES.find((item) => item.value === type) ?? TYPES[0];

  return (
    <div className="min-h-dvh bg-white lg:grid lg:grid-cols-[0.92fr_1.08fr]">
      <aside className="relative hidden overflow-hidden bg-brand p-10 text-white lg:flex lg:flex-col xl:p-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.13]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -right-32 -top-44 size-[560px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-10 -top-20 size-[320px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 size-[520px] rounded-full border border-white/10" />

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative my-auto max-w-[470px] py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
            Welcome to AshariBook
          </p>
          <h1 className="mt-4 text-[44px] font-semibold leading-[1.04] tracking-[-0.05em] xl:text-[52px]">
            Your money,
            <br />
            your accounts.
          </h1>
          <p className="mt-5 max-w-md text-[14px] leading-relaxed text-white/70">
            Start with the account you actually use. No default wallet, no guessed
            currency, no spreadsheet.
          </p>

          <div className="mt-9 space-y-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/12">
                  <feature.icon className="size-4" />
                </span>
                <div>
                  <p className="text-[13px] font-semibold">{feature.title}</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-white/60">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/15 pt-5 text-[11px] text-white/50">
          <span>One workspace, many currencies.</span>
          <span>Private by design</span>
        </div>
      </aside>

      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden">
            <Logo />
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted transition hover:bg-canvas hover:text-ink"
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[560px]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand">
              Set up your workspace
            </p>
            <h2 className="mt-2 text-[34px] font-semibold leading-tight tracking-[-0.045em] text-ink">
              Choose your first account
            </h2>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
              Pick where your money lives. You will set the name, currency and
              opening balance next. You can add more accounts later.
            </p>

            {error ? (
              <div className="mt-5 rounded-xl border border-danger/15 bg-danger-soft px-3 py-2.5 text-xs text-danger">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </div>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-2 text-[11px] font-semibold underline underline-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : null}

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {TYPES.map((option) => {
                const active = option.value === type;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "group relative flex min-h-[150px] flex-col rounded-2xl border p-4 text-left transition",
                      active
                        ? "border-brand/40 bg-brand-soft/60 shadow-[0_8px_28px_rgba(113,50,245,0.08)]"
                        : "border-line-soft bg-white hover:-translate-y-0.5 hover:border-line",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl transition",
                        active
                          ? "bg-brand text-white"
                          : "bg-canvas text-muted group-hover:text-ink",
                      )}
                    >
                      <option.icon className="size-[18px]" />
                    </span>
                    <span className="mt-4 text-[13px] font-semibold text-ink">
                      {option.label}
                    </span>
                    <span className="mt-1 text-[11px] leading-relaxed text-subtle">
                      {option.description}
                    </span>
                    {active ? (
                      <span className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <Button
              size="lg"
              className="mt-6 w-full"
              onClick={() => setDialogOpen(true)}
            >
              Continue with {selected.label.toLowerCase()}
              <ArrowRight className="size-4" />
            </Button>

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-canvas px-3 py-2.5 text-[10px] leading-relaxed text-subtle">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-brand" />
              <p>
                No default Cash account is created. You choose the account type,
                name and native currency. AshariBook never converts between
                currencies.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 text-[10px] text-subtle">
          <span>AshariBook · Personal finance</span>
          <span className="hidden sm:inline">Step 1 of 1</span>
        </div>
      </main>

      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultType={type}
      />
    </div>
  );
}

function OnboardingSplash() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas">
      <Logo />
      <div className="h-1 w-28 overflow-hidden rounded-full bg-line-soft">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
      </div>
    </div>
  );
}
