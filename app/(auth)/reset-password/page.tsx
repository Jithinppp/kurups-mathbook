"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function ResetPasswordPage() {
  const { user, loading, configured, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      await updatePassword(password);
      await signOut({ redirectTo: "/login?reset=1" });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not update your password.",
      );
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AuthShell>
        <div className="flex flex-col items-center text-center">
          <Loader2 className="size-6 animate-spin text-brand" />
          <p className="mt-4 text-[13px] text-muted">Checking your reset link…</p>
        </div>
      </AuthShell>
    );
  }

  if (!configured || !user) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <KeyRound className="size-6" />
          </div>
          <h2 className="mt-5 text-[28px] font-semibold tracking-[-0.04em] text-ink">
            Reset link expired
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            This password reset link is invalid or has expired. Request a new one
            to continue.
          </p>
          <Link
            href="/forgot-password"
            className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-medium text-white transition hover:bg-brand-dark"
          >
            Request a new link
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/login"
            className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line-soft bg-white text-sm font-medium text-ink transition hover:bg-canvas"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Back to sign in
        </Link>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">
          Account recovery
        </p>
        <h2 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.04em] text-ink">
          Choose a new password
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Use at least 8 characters. You&apos;ll sign in again with the new
          password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label htmlFor="password" className="text-[13px] font-medium text-ink">
              New password
            </label>
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

          <div className="space-y-2">
            <label
              htmlFor="confirm-password"
              className="text-[13px] font-medium text-ink"
            >
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="••••••••"
                className="h-11 w-full rounded-xl border border-line bg-white pl-10 pr-3.5 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10"
              />
            </div>
          </div>

          {error ? (
            <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full" loading={saving}>
            Update password
            <ArrowRight className="size-4" />
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
