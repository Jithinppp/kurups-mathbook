import { localeForCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

const decimalFormatters = new Map<string, Intl.NumberFormat>();

function decimalFormatter(currency: string) {
  const locale = localeForCurrency(currency);
  const existing = decimalFormatters.get(locale);
  if (existing) return existing;
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  decimalFormatters.set(locale, formatter);
  return formatter;
}

export function Money({
  value,
  currency,
  className,
  showSign = false,
  codeClassName,
}: {
  value: number;
  currency: string;
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
      <span>{decimalFormatter(currency).format(Math.abs(value))}</span>
    </span>
  );
}
