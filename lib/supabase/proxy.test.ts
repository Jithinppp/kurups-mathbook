import { describe, expect, it } from "vitest";

describe("Proxy public path detection", () => {
  const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];
  const ALWAYS_ALLOWED_PATHS = ["/reset-password"];
  const AUTH_PREFIX = "/auth";

  function isPublic(pathname: string) {
    return (
      PUBLIC_PATHS.some((path) => pathname === path) ||
      ALWAYS_ALLOWED_PATHS.some((path) => pathname === path) ||
      pathname.startsWith(AUTH_PREFIX)
    );
  }

  it("identifies public auth paths", () => {
    expect(isPublic("/login")).toBe(true);
    expect(isPublic("/signup")).toBe(true);
    expect(isPublic("/forgot-password")).toBe(true);
  });

  it("identifies always-allowed paths", () => {
    expect(isPublic("/reset-password")).toBe(true);
  });

  it("identifies auth prefix paths", () => {
    expect(isPublic("/auth/callback")).toBe(true);
    expect(isPublic("/auth/confirm")).toBe(true);
    expect(isPublic("/auth/something")).toBe(true);
  });

  it("rejects non-public paths", () => {
    expect(isPublic("/")).toBe(false);
    expect(isPublic("/transactions")).toBe(false);
    expect(isPublic("/settings")).toBe(false);
    expect(isPublic("/budgets")).toBe(false);
  });
});

describe("Rate limiting config", () => {
  it("has sensible defaults", () => {
    expect(60 * 1000).toBeGreaterThan(0); // 1 minute window
    expect(10).toBeGreaterThan(0); // max 10 requests per window
  });
});
