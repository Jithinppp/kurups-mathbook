"use client";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, enterDemo, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!configured) {
      setError(
        "Supabase isn't connected yet. Use the demo workspace or add your project keys.",
      );
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/");
      router.refresh();
    } catch (signInError) {
      const message =
        signInError instanceof Error ? signInError.message : "Could not sign in.";
      setError(
        message.toLowerCase().includes("invalid login")
          ? "That email and password don't match."
          : message.toLowerCase().includes("email not confirmed")
            ? "Confirm your email first, then sign in."
            : message,
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

  return (
    <AuthShell>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
          Welcome back
        </p>
        <h2 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-ink">
          Sign in to Kurup
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Pick up where the month left off.
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
                  Supabase isn&apos;t connected in this build, so email sign in
                  is paused. Open the demo with a full month of sample data.
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
                autoComplete="current-password"
                required
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
            Sign in
            <ArrowRight className="size-4" />
          </Button>
        </form>

        {configured ? (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleDemo}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-brand/15 bg-white px-3.5 text-[12px] font-medium text-brand transition hover:border-brand/25 hover:bg-brand-soft/60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/15"
            >
              <Sparkles className="size-3.5" />
              Open demo workspace
            </button>
          </div>
        ) : null}

        <div className="mt-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line-soft" />
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-subtle">
            New to Kurup?
          </span>
          <span className="h-px flex-1 bg-line-soft" />
        </div>

        <Link
          href="/signup"
          className="mt-4 flex h-11 w-full items-center justify-center rounded-xl border border-line-soft bg-white text-sm font-medium text-ink transition hover:bg-canvas"
        >
          Create an account
        </Link>

        <p className="mt-6 text-center text-[10px] leading-relaxed text-subtle">
          By continuing you agree to keep your own books honest.
          <br />
          Base currency is fixed to AED after setup.
        </p>
      </div>
    </AuthShell>
  );
}
