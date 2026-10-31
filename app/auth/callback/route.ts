import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { safeNextPath } from "@/lib/auth-redirect";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function loginErrorUrl(requestUrl: URL, error: string) {
  return new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const nextParam = requestUrl.searchParams.get("next");
  const next = type === "recovery" ? "/reset-password" : safeNextPath(nextParam);
  const errorCode =
    requestUrl.searchParams.get("error_code") ??
    requestUrl.searchParams.get("error");

  if (!url || !anonKey) {
    return NextResponse.redirect(new URL("/login", requestUrl.origin));
  }

  if (errorCode) {
    const error =
      errorCode === "otp_expired"
        ? "expired"
        : type === "recovery"
          ? "recovery"
          : "access_denied";
    return NextResponse.redirect(loginErrorUrl(requestUrl, error));
  }

  if (!code && !(tokenHash && type)) {
    return NextResponse.redirect(loginErrorUrl(requestUrl, "auth_callback"));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // The proxy refreshes the session on the next request.
        }
      },
    },
  });

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
    return NextResponse.redirect(loginErrorUrl(requestUrl, "expired"));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code!);
  if (!error) {
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  return NextResponse.redirect(
    loginErrorUrl(requestUrl, type === "recovery" ? "recovery" : "auth_callback"),
  );
}
