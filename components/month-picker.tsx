"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, currentMonthKey, formatMonth } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function MonthPicker({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (month: string) => void;
  className?: string;
}) {
  const current = currentMonthKey();
  const months = Array.from({ length: 24 }, (_, index) =>
    addMonths(current, -index),
  );
  if (!months.includes(value)) months.push(value);
  months.sort((a, b) => b.localeCompare(a));

  return (
    <div
      className={cn(
        "inline-flex h-10 items-center rounded-xl border border-line-soft bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,0.03)]",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange(addMonths(value, -1))}
        className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
        aria-label="Previous month"
      >
        <ChevronLeft className="size-4" />
      </button>
      <div className="relative px-2">
        <span className="pointer-events-none block min-w-[92px] text-center text-[13px] font-medium text-ink sm:min-w-[112px]">
          {formatMonth(value, "short")}
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Choose month"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(month)}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={() => onChange(addMonths(value, 1))}
        disabled={value >= current}
        className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink disabled:pointer-events-none disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
        aria-label="Next month"
      >
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
