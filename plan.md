# Fix Multi-Currency Totals — Implementation Plan

## Problem
When records exist in multiple currencies (e.g. EUR + USD), totals are naively summed as raw numbers — mixing €1000 + $500 = "1500" displayed as a single currency. This affects exports, contacts, reports, the AI assistant, and category analytics.

---

## Affected Locations (by priority)

| # | File | Lines | Severity |
|---|------|-------|----------|
| 1 | `src/pages/Contacts.tsx` | 95-96, 114-116, 134-135, 153-155, 295, 345 | CRITICAL |
| 2 | `src/pages/Exports.tsx` | 376-378, 430-432 | CRITICAL |
| 3 | `src/pages/Income.tsx` | 171 | HIGH |
| 4 | `src/pages/Expenses.tsx` | 169 | HIGH |
| 5 | `supabase/functions/ai-assistant/index.ts` | 106-121 | HIGH |
| 6 | `src/components/CategoryAnalytics.tsx` | 128 | MEDIUM |

**Already safe:** `src/pages/Reports.tsx` — filters by currency before aggregation.

---

## Approach

**No exchange rates / currency conversion.** Instead, group totals by currency and display them separately (e.g. "€1,200 + $500"). This matches accounting best practices — you don't mix currencies without an explicit conversion rate.

### Shared Utility

**Step 1 — Create a `groupByCurrency` helper and a `MultiCurrencyTotal` display component**

File: `src/lib/currency-utils.ts` (new)

```ts
// Groups records by currency and sums net/vat/total per currency
export function groupByCurrency(
  records: { currency: string; net_amount: number; vat_amount: number; total_amount: number }[]
): Map<string, { net: number; vat: number; total: number; count: number }>
```

File: `src/components/MultiCurrencyTotal.tsx` (new)

A small component that renders grouped totals, e.g.:
- Single currency → `€1,200.00`
- Multi currency → `€1,200.00 · $500.00`

---

### Per-Location Fixes

**Step 2 — Contacts.tsx**

- Change the `DerivedContact` interface: replace single `totalAmount`, `expenseTotal`, `incomeTotal` (number) with currency-keyed maps: `expenseTotals: Map<string, number>`, `incomeTotals: Map<string, number>`.
- Update `deriveContacts()` to accumulate per-currency.
- Update the contact list rows and the contact detail card to render per-currency totals using `MultiCurrencyTotal`.
- Update `netBalance` in the detail card to show per-currency net (only for currencies present in both income and expense).
- Update the `groupByMonth` helper inside Contacts to group by currency within each month.

**Step 3 — Exports.tsx**

- When currency filter is "all": generate separate summary rows per currency in the PDF/CSV/Excel output (e.g. "NET TOTAL (EUR)", "NET TOTAL (USD)").
- When a specific currency is selected: behaviour stays the same (already filtered).
- Update `fmtCurrency` calls to use the record's own currency, not a single `cur` variable.

**Step 4 — Income.tsx & Expenses.tsx**

- Update `groupByMonth()` to produce per-currency subtotals within each month group.
- Render monthly totals using `MultiCurrencyTotal`.
- The top-level `currencySummary` is already correct — no changes needed there.

**Step 5 — AI Assistant (Edge Function)**

- In `supabase/functions/ai-assistant/index.ts`, group `totalExpenses`, `totalIncome`, `totalVatExpenses`, `totalVatIncome` by currency before building the summary string.
- Group `expByCat` and `supplierTotals` by currency as well.
- Update the prompt context string to include currency labels.

**Step 6 — CategoryAnalytics.tsx**

- Change `totalSpend` to be per-currency.
- Update pie chart percentages to only compare within the same currency, or show separate charts per currency.

---

## Implementation Order

1. `src/lib/currency-utils.ts` — shared helper (no dependencies)
2. `src/components/MultiCurrencyTotal.tsx` — shared UI component
3. `src/pages/Contacts.tsx` — highest user impact
4. `src/pages/Exports.tsx` — highest data-accuracy impact
5. `src/pages/Income.tsx` + `src/pages/Expenses.tsx` — can be done together
6. `supabase/functions/ai-assistant/index.ts` — backend change
7. `src/components/CategoryAnalytics.tsx` — lowest priority

---

## Testing

- Verify with records in EUR only → single total shown, no regressions.
- Verify with records in EUR + USD → separate totals shown per currency.
- Verify exports (PDF/CSV/Excel) show per-currency summary rows.
- Verify contact card shows per-currency breakdown.
- Verify AI assistant returns currency-labeled summaries.
