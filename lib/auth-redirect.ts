const FALLBACK_SITE_URL = "http://localhost:3000";

/**
 * The public origin used in Supabase email links.
 *
 * Set NEXT_PUBLIC_SITE_URL in deployed environments so confirmation and
 * recovery emails never point at a developer's localhost. In the browser we
 * fall back to the current origin, which keeps local development working.
 */
export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return FALLBACK_SITE_URL;
}

export function getAuthCallbackUrl(next?: string) {
  const base = getSiteUrl();
  const callback = `${base}/auth/callback`;
  if (!next) return callback;
  return `${callback}?next=${encodeURIComponent(next)}`;
}

/** Only allow same-origin absolute paths as post-auth destinations. */
export function safeNextPath(value: string | null | undefined, fallback = "/") {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  return value;
}
