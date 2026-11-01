import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth-redirect";

describe("safeNextPath", () => {
  it("returns fallback for null/undefined/empty", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
  });

  it("allows same-origin absolute paths", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/transactions?month=2026-11")).toBe(
      "/transactions?month=2026-11",
    );
  });

  it("rejects protocol-relative URLs (//)", () => {
    expect(safeNextPath("//evil.com")).toBe("/");
  });

  it("rejects backslash paths", () => {
    expect(safeNextPath("\\evil.com")).toBe("/");
  });

  it("rejects path traversal (..)", () => {
    expect(safeNextPath("/../../../etc/passwd")).toBe("/");
    expect(safeNextPath("/foo/../bar")).toBe("/");
  });

  it("rejects non-slash-prefixed paths", () => {
    expect(safeNextPath("relative/path")).toBe("/");
    expect(safeNextPath("https://evil.com")).toBe("/");
  });

  it("uses custom fallback", () => {
    expect(safeNextPath("//evil.com", "/login")).toBe("/login");
  });
});
