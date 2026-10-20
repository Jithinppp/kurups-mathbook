"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MailCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signUp, enterDemo, configured } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!configured) {
      setError(
        "Supabase isn't connected yet. Use the demo workspace or add your project keys.",
      );
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(name.trim(), email, password);
      if (result.needsConfirmation) {
        setSentTo(email);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (signUpError) {
      setError(
        signUpError instanceof Error
          ? signUpError.message
          : "Could not create your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDemo() {
    enterDemo();
    router.push("/");
    router.refresh();
  }

  if (sentTo) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success-dark">
            <MailCheck className="size-6" />
          </div>
          <h2 className="mt-5 text-[28px] font-semibold tracking-[-0.04em] text-ink">
            Check your inbox
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            We sent a confirmation link to <strong>{sentTo}</strong>. Open it to
            finish setting up your workspace.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => router.push("/login")}
          >
            Back to sign in
            <ArrowRight className="size-4" />
          </Button>
          <p className="mt-4 text-[10px] text-subtle">
            Once confirmed, your first sign in creates your personal categories
            and cash wallet automatically.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
          Get started
        </p>
        <h2 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-ink">
          Create your workspace
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          One account, one base currency, and a clear view of the month.
        </p>

        {!configured ? (
          <div className="mt-6 rounded-2xl border border-brand/15 bg-brand-soft/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-brand shadow-[0_1px_4px_rgba(16,24,40,0.06)]">
                <Sparkles className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink">
                  Preview the workspace
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">
                  Supabase isn&apos;t connected in this build. Explore the app now
                  with a demo account and sample transactions.
                </p>
              </div>
            </div>
            <Button className="mt-3 w-full" onClick={handleDemo}>
              Open demo workspace
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-[13px] font-medium text-ink">
              Full name
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
                placeholder="Jithin"
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-[13px] font-medium text-ink">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                placeholder="you@example.com"
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className="text-[13px] font-medium text-ink">
                Password
              </label>
              <span className="text-[10px] text-subtle">At least 8 characters</span>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-11 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-subtle transition hover:bg-canvas hover:text-ink"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Create account
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <Link
          href="/login"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-soft bg-white text-sm font-medium text-ink transition hover:bg-canvas"
        >
          <ArrowLeft className="size-4" />
          I already have an account
        </Link>

        <p className="mt-6 text-center text-[10px] leading-relaxed text-subtle">
          Your workspace starts with AED as its base currency.
          <br />
          Every user&apos;s data is isolated with row-level security.
        </p>
      </div>
    </AuthShell>
  );
}
