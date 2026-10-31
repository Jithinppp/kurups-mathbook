"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Mail,
  MailCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

export default function ForgotPasswordPage() {
  const { requestPasswordReset, configured } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!configured) {
      setError(
        "Supabase isn't connected yet. Add your project keys to enable email sign in.",
      );
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSentTo(email.trim());
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not send the reset email.",
      );
    } finally {
      setLoading(false);
    }
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
            If an AshariBook account exists for <strong>{sentTo}</strong>, we
            sent a password reset link. Open it to choose a new password.
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[10px] leading-relaxed text-subtle">
            The link can take a minute to arrive. Check spam or promotions if you
            don&apos;t see it.
          </p>
          <Button
            className="mt-6 w-full"
            onClick={() => setSentTo(null)}
            variant="secondary"
          >
            Use a different email
          </Button>
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
          Reset your password
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-muted">
          Enter the email you use for AshariBook. We&apos;ll send a secure link
          to choose a new password.
        </p>

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

          {error ? (
            <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-xs text-danger">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </div>
          ) : null}

          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Send reset link
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <p className="mt-5 text-center text-[10px] leading-relaxed text-subtle">
          For your security, we don&apos;t reveal whether an email is registered.
        </p>
      </div>
    </AuthShell>
  );
}
