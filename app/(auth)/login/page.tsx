"use client";

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MailCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { safeNextPath } from "@/lib/auth-redirect";

type Notice = { tone: "error" | "success"; message: string };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <div className="text-center text-[13px] text-muted">
            Loading sign in…
          </div>
        </AuthShell>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, enterDemo, resendConfirmation, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);

  const errorCode = searchParams.get("error");
  const reset = searchParams.get("reset");
  const confirmed = searchParams.get("confirmed");
  const deleted = searchParams.get("deleted");
  const nextParam = searchParams.get("next");
  const nextPath = safeNextPath(nextParam);
  const derivedNotice: Notice | null = errorCode
    ? { tone: "error", message: authErrorMessage(errorCode) }
    : reset
      ? {
          tone: "success",
          message: "Password updated. Sign in with your new password.",
        }
      : confirmed
        ? {
            tone: "success",
            message: "Email confirmed. Sign in to continue.",
          }
        : deleted
          ? {
              tone: "success",
              message:
                "Your account and all workspace data have been permanently deleted.",
            }
          : null;
  const notice = noticeDismissed ? null : derivedNotice;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setNoticeDismissed(true);
    setCanResend(false);
    setResendNotice(null);
    if (!configured) {
      setError(
        "Supabase isn't connected yet. Use the demo workspace or add your project keys.",
      );
      return;
    }
    setLoading(true);
    try {
      await signIn(email, password);
      router.push(nextPath);
      router.refresh();
    } catch (signInError) {
      const message =
        signInError instanceof Error ? signInError.message : "Could not sign in.";
      if (message.toLowerCase().includes("email not confirmed")) {
        setCanResend(true);
      }
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

  async function handleResend() {
    if (!email.trim()) return;
    setResendLoading(true);
    setResendNotice(null);
    try {
      await resendConfirmation(email);
      setResendNotice(
        "Confirmation email sent. Check your inbox and spam folder.",
      );
    } catch (caught) {
      setResendNotice(
        caught instanceof Error ? caught.message : "Could not resend the email.",
      );
    } finally {
      setResendLoading(false);
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
          Sign in to AshariBook
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Pick up where the month left off.
        </p>

        {notice ? (
          <div
            className={
              notice.tone === "error"
                ? "mt-5 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger"
                : "mt-5 flex items-start gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-xs text-success-dark"
            }
          >
            {notice.tone === "error" ? (
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            ) : (
              <MailCheck className="mt-0.5 size-3.5 shrink-0" />
            )}
            {notice.message}
          </div>
        ) : null}

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
              <Link
                href="/forgot-password"
                className="text-[10px] font-medium text-brand transition hover:text-brand-dark"
              >
                Forgot password?
              </Link>
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
            <div className="rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </div>
              {canResend ? (
                <div className="mt-2 border-t border-danger/10 pt-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading}
                    className="text-[11px] font-semibold text-danger underline-offset-2 transition hover:underline disabled:opacity-60"
                  >
                    {resendLoading
                      ? "Sending confirmation email…"
                      : "Resend confirmation email"}
                  </button>
                  {resendNotice ? (
                    <p className="mt-1 text-[10px] leading-relaxed text-danger/80">
                      {resendNotice}
                    </p>
                  ) : null}
                </div>
              ) : null}
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
            New to AshariBook?
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
          Every account keeps its own currency after setup.
        </p>
      </div>
    </AuthShell>
  );
}

function authErrorMessage(code: string) {
  switch (code) {
    case "expired":
      return "That email link has expired or was already used. Request a new one and try again.";
    case "access_denied":
      return "That email link was cancelled or has already been used.";
    case "recovery":
      return "That password reset link is invalid or has expired. Request a new one.";
    case "confirmation":
      return "We couldn't confirm that email link. Sign in to request a new confirmation email.";
    case "auth_callback":
      return "We couldn't complete that sign-in link. It may have expired or been used already.";
    default:
      return "We couldn't complete that sign-in link. Please try again.";
  }
}
