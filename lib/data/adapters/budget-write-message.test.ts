import { describe, expect, it } from "vitest";
import { budgetWriteMessage } from "@/lib/data/adapters/budget-write-message";

describe("budgetWriteMessage", () => {
  it("passes through normal error messages", () => {
    expect(budgetWriteMessage("Something went wrong")).toBe(
      "Something went wrong",
    );
    expect(budgetWriteMessage("")).toBe("");
  });

  it("detects schema-related errors", () => {
    const schemaErrors = [
      'column "account_id" does not exist',
      "invalid currency code",
      "schema cache missing",
      "relation does not exist",
      "could not find the constraint",
      "no unique constraint",
      "on_conflict target contains column not present",
      "exclusion constraint violation",
    ];
    for (const msg of schemaErrors) {
      expect(budgetWriteMessage(msg)).toContain(
        "Budgets now belong to an account",
      );
    }
  });
});
