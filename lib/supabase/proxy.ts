import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];
const ALWAYS_ALLOWED_PATHS = ["/reset-password"];
const AUTH_PREFIX = "/auth";
const DEMO_COOKIE = "asharibook-demo";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = Boolean(url && anonKey);

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((path) => pathname === path) ||
    ALWAYS_ALLOWED_PATHS.some((path) => pathname === path) ||
    pathname.startsWith(AUTH_PREFIX)
  );
}

function redirectWithCookies(
  request: NextRequest,
  pathname: string,
  response: NextResponse,
) {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

/**
 * Older recovery templates appended `&token_hash=...` to the callback URL even
 * when it had no query string. The browser treats that as part of the path
 * (`/auth/callback&token_hash=...`) and Next.js returns 404. Repair those links
 * so emails already in an inbox still work after this fix is deployed.
 */
function redirectMalformedAuthPath(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/auth\/(callback|confirm)&(.+)$/);
  if (!match) return null;

  const [, route, rawQuery] = match;
  const params = new URLSearchParams(rawQuery);
  request.nextUrl.searchParams.forEach((value, key) => params.set(key, value));

  const target = new URL(`/auth/${route}`, request.url);
  params.forEach((value, key) => target.searchParams.set(key, value));
  return NextResponse.redirect(target);
}

/**
 * Supabase falls back to the configured Site URL when a redirect URL is not
 * allow-listed. In that case the auth token can land on the site root. Forward
 * those requests to the callback so a misconfigured allow list does not turn a
 * recovery email into a blank or invalid page.
 */
function redirectAuthParams(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith(AUTH_PREFIX)) return null;

  const params = request.nextUrl.searchParams;
  if (
    !params.has("token_hash") &&
    !params.has("code") &&
    !params.has("error_code")
  ) {
    return null;
  }

  const callback = new URL("/auth/callback", request.url);
  params.forEach((value, key) => callback.searchParams.set(key, value));
  return NextResponse.redirect(callback);
}

export async function updateSession(request: NextRequest) {
  const malformedAuthRedirect = redirectMalformedAuthPath(request);
  if (malformedAuthRedirect) return malformedAuthRedirect;

  const authRedirect = redirectAuthParams(request);
  if (authRedirect) return authRedirect;

  const pathname = request.nextUrl.pathname;
  const publicRoute = isPublic(pathname);
  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === "1";

  // Demo mode is local-only and available even when Supabase is connected.
  // It should never fall through to Supabase session checks.
  if (isDemo) {
    if (PUBLIC_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!configured) {
    if (!publicRoute) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url!, anonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !publicRoute) {
    return redirectWithCookies(
      request,
      `/login?next=${encodeURIComponent(pathname)}`,
      response,
    );
  }

  if (user && PUBLIC_PATHS.includes(pathname)) {
    return redirectWithCookies(request, "/", response);
  }

  return response;
}
