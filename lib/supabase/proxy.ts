import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/signup"];
const AUTH_PREFIX = "/auth";
const DEMO_COOKIE = "asharibook-demo";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = Boolean(url && anonKey);

function isPublic(pathname: string) {
  return (
    PUBLIC_PATHS.some((path) => pathname === path) ||
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

export async function updateSession(request: NextRequest) {
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
