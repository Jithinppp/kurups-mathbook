"use client";

import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({
  segments,
  total,
  centerLabel,
  className,
}: {
  segments: DonutSegment[];
  total: number;
  centerLabel?: string;
  className?: string;
}) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className={cn("flex flex-col items-center gap-5 sm:flex-row", className)}>
      <div className="relative size-[148px] shrink-0">
        <svg
          viewBox="0 0 140 140"
          className="size-full -rotate-90"
          role="img"
          aria-label="Spending by category"
        >
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#f0f0f4"
            strokeWidth="13"
          />
          {total > 0
            ? segments.map((segment) => {
                const length = (segment.value / total) * circumference;
                const dash = Math.max(0, length - 4);
                const element = (
                  <circle
                    key={segment.label}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="13"
                    strokeDasharray={`${dash} ${circumference - dash}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                  />
                );
                offset += length;
                return element;
              })
            : null}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="tabular text-[17px] font-semibold tracking-[-0.02em] text-ink">
            {formatCompact(total)}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-subtle">
            {centerLabel ?? "Spent"}
          </span>
        </div>
      </div>
      <div className="w-full min-w-0 flex-1 space-y-2 self-stretch">
        {segments.slice(0, 5).map((segment) => (
          <div key={segment.label} className="flex items-center gap-2.5">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="min-w-0 flex-1 truncate text-xs text-muted">
              {segment.label}
            </span>
            <span className="tabular text-xs font-semibold text-ink">
              {formatCompact(segment.value)}
            </span>
          </div>
        ))}
        {segments.length === 0 ? (
          <p className="text-xs text-subtle">No spending recorded yet.</p>
        ) : null}
      </div>
    </div>
  );
}
