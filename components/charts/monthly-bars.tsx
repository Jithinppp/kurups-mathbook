"use client";

import { formatMonth } from "@/lib/dates";
import type { MonthPoint } from "@/lib/finance";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MonthlyBars({
  data,
  selectedMonth,
  currency,
}: {
  data: MonthPoint[];
  selectedMonth: string;
  currency: string;
}) {
  const max = Math.max(
    1,
    ...data.flatMap((point) => [point.expenses, point.income]),
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-[11px] font-medium text-muted">
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-brand" /> Expenses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-success/45" /> Income
        </span>
      </div>
      <div className="flex h-[184px] items-end gap-1.5 sm:gap-3">
        {data.map((point) => {
          const selected = point.month === selectedMonth;
          return (
            <div
              key={point.month}
              className={cn(
                "group flex min-w-0 flex-1 flex-col items-center rounded-xl px-1 pb-1 pt-2 transition-colors",
                selected ? "bg-brand-soft/60" : "hover:bg-canvas",
              )}
            >
              <div className="flex h-[130px] w-full items-end justify-center gap-[3px] sm:gap-1.5">
                <div
                  className="w-full max-w-[14px] rounded-t-[5px] bg-brand transition-all group-hover:opacity-90"
                  style={{
                    height: `${Math.max(3, (point.expenses / max) * 100)}%`,
                  }}
                  title={`${formatMonth(point.month)} expenses: ${formatCompact(
                    point.expenses,
                    currency,
                  )}`}
                />
                <div
                  className="w-full max-w-[14px] rounded-t-[5px] bg-success/40 transition-all group-hover:bg-success/55"
                  style={{
                    height: `${Math.max(3, (point.income / max) * 100)}%`,
                  }}
                  title={`${formatMonth(point.month)} income: ${formatCompact(
                    point.income,
                    currency,
                  )}`}
                />
              </div>
              <span
                className={cn(
                  "mt-2.5 text-[10px] font-medium sm:text-[11px]",
                  selected ? "text-brand-dark" : "text-subtle",
                )}
              >
                {formatMonth(point.month, "short").slice(0, 3)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
