export function localeForCurrency(currency: string) {
  return currency === "INR" ? "en-IN" : "en-AE";
}

const numberFormatters = new Map<string, Intl.NumberFormat>();

function getNumberFormatter(
  locale: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = numberFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, options);
    numberFormatters.set(key, formatter);
  }
  return formatter;
}

export function formatMoney(
  value: number,
  currency: string,
  options: { compact?: boolean; decimals?: boolean } = {},
) {
  const { compact = false, decimals = true } = options;
  const formatter = getNumberFormatter(localeForCurrency(currency), {
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
  const formatter = getNumberFormatter("en-AE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return formatter.format(value);
}

export function formatCompactNumber(value: number, currency: string) {
  const formatter = getNumberFormatter(localeForCurrency(currency), {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  return formatter.format(Math.abs(value));
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  AED: "Dh",
  SAR: "SR",
  QAR: "QR",
  KWD: "KD",
  OMR: "RO",
  BHD: "BD",
  JOD: "JD",
  KES: "KSh",
};

const currencySymbolCache = new Map<string, string>();

/**
 * A compact currency label for tight mobile layouts. Falls back to the
 * three-letter code when the locale does not expose a distinct symbol.
 */
export function currencySymbol(currency: string) {
  const code = currency.toUpperCase();
  const cached = currencySymbolCache.get(code);
  if (cached) return cached;

  const custom = CURRENCY_SYMBOLS[code];
  if (custom) {
    currencySymbolCache.set(code, custom);
    return custom;
  }

  try {
    const formatter = getNumberFormatter(localeForCurrency(code), {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    });
    const symbol = formatter.formatToParts(0).find((part) => part.type === "currency")?.value;
    const result = symbol || code;
    currencySymbolCache.set(code, result);
    return result;
  } catch {
    currencySymbolCache.set(code, code);
    return code;
  }
}

export function formatSignedMoney(value: number, currency: string) {
  const sign = value < 0 ? "−" : "+";
  return `${sign}${formatMoney(value, currency)}`;
}

export function formatPercent(value: number, decimals = 0) {
  const formatter = getNumberFormatter("en-AE", {
    maximumFractionDigits: decimals,
  });
  return `${formatter.format(value)}%`;
}

export function formatCompact(value: number, currency: string) {
  return formatMoney(value, currency, { compact: true });
}
