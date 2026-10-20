import { cn } from "@/lib/utils";

const decimalFormatter = new Intl.NumberFormat("en-AE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function Money({
  value,
  currency = "AED",
  className,
  showSign = false,
  codeClassName,
}: {
  value: number;
  currency?: string;
  className?: string;
  showSign?: boolean;
  codeClassName?: string;
}) {
  const negative = value < 0;
  const prefix = showSign ? (negative ? "−" : "+") : negative ? "−" : "";
  return (
    <span className={cn("tabular inline-flex items-baseline gap-1 whitespace-nowrap", className)}>
      <span>{prefix}</span>
      <span className={cn("text-[0.68em] font-semibold tracking-[0.02em]", codeClassName)}>
        {currency}
      </span>
      <span>{decimalFormatter.format(Math.abs(value))}</span>
    </span>
  );
}
