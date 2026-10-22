export function localeForCurrency(currency: string) {
  return currency === "INR" ? "en-IN" : "en-AE";
}

export function formatMoney(
  value: number,
  currency: string,
  options: { compact?: boolean; decimals?: boolean } = {},
) {
  const { compact = false, decimals = true } = options;
  const formatter = new Intl.NumberFormat(localeForCurrency(currency), {
    style: "currency",
    currency,
    currencyDisplay: "code",
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: compact || !decimals ? 0 : 2,
    maximumFractionDigits: compact ? 1 : decimals ? 2 : 0,
  });
  return formatter.format(Math.abs(value));
}

export function formatNumber(value: number, decimals = 2) {
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatSignedMoney(value: number, currency: string) {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${formatMoney(value, currency)}`;
}

export function formatPercent(value: number, decimals = 0) {
  return `${new Intl.NumberFormat("en-AE", {
    maximumFractionDigits: decimals,
  }).format(value)}%`;
}

export function formatCompact(value: number, currency: string) {
  return formatMoney(value, currency, { compact: true });
}
