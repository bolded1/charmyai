// ─── Multi-currency grouping utilities ───────────────────────────────────────

export interface CurrencyTotal {
  currency: string;
  net: number;
  vat: number;
  total: number;
  count: number;
}

/**
 * Groups financial records by currency and sums net/vat/total per currency.
 * Returns an array sorted by total descending, with `defaultCurrency` first.
 */
export function groupByCurrency(
  records: { currency: string; net_amount: number; vat_amount: number; total_amount: number }[],
  defaultCurrency = "EUR",
): CurrencyTotal[] {
  const map = new Map<string, CurrencyTotal>();

  for (const r of records) {
    const c = r.currency || defaultCurrency;
    const existing = map.get(c);
    if (existing) {
      existing.net += Number(r.net_amount || 0);
      existing.vat += Number(r.vat_amount || 0);
      existing.total += Number(r.total_amount || 0);
      existing.count += 1;
    } else {
      map.set(c, {
        currency: c,
        net: Number(r.net_amount || 0),
        vat: Number(r.vat_amount || 0),
        total: Number(r.total_amount || 0),
        count: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.currency === defaultCurrency) return -1;
    if (b.currency === defaultCurrency) return 1;
    return b.total - a.total;
  });
}

/**
 * Formats a number as currency.
 */
export function fmtCurrencyValue(n: number, currency: string): string {
  if (!isFinite(n)) return `${currency} 0.00`;
  try {
    return n.toLocaleString(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

/**
 * Formats grouped currency totals as a joined string, e.g. "€1,200.00 · $500.00"
 */
export function formatMultiCurrencyTotal(
  totals: CurrencyTotal[],
  field: "net" | "vat" | "total" = "total",
): string {
  return totals
    .filter((t) => t.count > 0)
    .map((t) => fmtCurrencyValue(t[field], t.currency))
    .join(" · ");
}
