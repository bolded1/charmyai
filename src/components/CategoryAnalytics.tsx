import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Trophy, BarChart3, CalendarRange, ChevronDown, Wallet } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ExpenseCategory } from "@/hooks/useExpenseCategories";

interface ExpenseRecord {
  category: string | null;
  currency: string;
  total_amount: number;
  invoice_date: string;
}

interface CategoryAnalyticsProps {
  expenses: ExpenseRecord[];
  isLoading: boolean;
  categories?: ExpenseCategory[];
}

export default function CategoryAnalytics({ expenses, isLoading, categories = [] }: CategoryAnalyticsProps) {
  const [open, setOpen] = useState(false);

  const currencies = useMemo(() => {
    const set = new Set(expenses.map((e) => e.currency));
    return Array.from(set).sort();
  }, [expenses]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const activeCurrency = selectedCurrency || currencies[0] || "EUR";

  const filtered = useMemo(
    () => expenses.filter((e) => e.currency === activeCurrency),
    [expenses, activeCurrency]
  );

  const categoryTotals = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((e) => {
      const cat = e.category || "Uncategorized";
      map.set(cat, (map.get(cat) || 0) + Number(e.total_amount));
    });
    return Array.from(map.entries())
      .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const topCategories = categoryTotals.slice(0, 5);

  const categoryColorMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.name, c.color])),
    [categories]
  );

  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const budgetedCategories = useMemo(
    () => categories.filter((c) => c.monthly_budget != null && c.monthly_budget > 0),
    [categories]
  );

  // Actuals for the selected currency only (used for budget progress bars)
  const currentMonthActuals = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((e) => {
      if (e.invoice_date?.slice(0, 7) === currentMonthKey && e.category) {
        map.set(e.category, (map.get(e.category) || 0) + Number(e.total_amount));
      }
    });
    return map;
  }, [filtered, currentMonthKey]);

  // Actuals across ALL currencies per category (used for multi-currency budget breakdown)
  const currentMonthAllCurrencyActuals = useMemo(() => {
    const map = new Map<string, Map<string, number>>();
    expenses.forEach((e) => {
      if (e.invoice_date?.slice(0, 7) === currentMonthKey && e.category) {
        if (!map.has(e.category)) map.set(e.category, new Map());
        const inner = map.get(e.category)!;
        inner.set(e.currency, (inner.get(e.currency) || 0) + Number(e.total_amount));
      }
    });
    return map;
  }, [expenses, currentMonthKey]);

  const monthlyTrends = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      });
    }

    const topCats = categoryTotals.slice(0, 4).map((c) => c.name);

    const data = months.map(({ key, label }) => {
      const row: Record<string, any> = { month: label };
      topCats.forEach((cat) => {
        row[cat] = 0;
      });
      filtered.forEach((e) => {
        const eMonth = e.invoice_date?.slice(0, 7);
        if (eMonth === key) {
          const cat = e.category || "Uncategorized";
          if (topCats.includes(cat)) {
            row[cat] = Math.round(((row[cat] || 0) + Number(e.total_amount)) * 100) / 100;
          }
        }
      });
      return row;
    });

    return { data, categories: topCats };
  }, [filtered, categoryTotals]);

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
  ];

  const totalSpend = categoryTotals.reduce((sum, c) => sum + c.total, 0);

  if (isLoading) return null;
  if (expenses.length === 0) return null;

  const formatAmount = (v: number, currency = activeCurrency) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors rounded-t-lg pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Category Analytics
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Currency pills — always visible in header */}
                {currencies.length > 1 ? (
                  currencies.map((c) => (
                    <button
                      key={c}
                      onClick={(e) => { e.stopPropagation(); setSelectedCurrency(c); }}
                      className={[
                        "text-xs px-2.5 py-1 rounded-full border font-medium transition-colors",
                        c === activeCurrency
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground bg-background",
                      ].join(" ")}
                    >
                      {c}
                    </button>
                  ))
                ) : (
                  <Badge variant="secondary" className="text-xs">{activeCurrency}</Badge>
                )}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">

            {/* Cross-currency summary row */}
            {currencies.length > 1 && (
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/30 border text-sm mt-1">
                <span className="text-xs text-muted-foreground font-medium">All currencies:</span>
                {currencies.map((c) => {
                  const total = expenses
                    .filter((e) => e.currency === c)
                    .reduce((s, e) => s + Number(e.total_amount), 0);
                  return (
                    <span
                      key={c}
                      className={`font-semibold tabular-nums ${c === activeCurrency ? "text-primary" : "text-foreground"}`}
                    >
                      {formatAmount(total, c)}
                    </span>
                  );
                })}
                <span className="text-xs text-muted-foreground ml-auto hidden sm:block">
                  Showing {activeCurrency} breakdown below
                </span>
              </div>
            )}

            {/* Empty state when selected currency has no records */}
            {filtered.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No {activeCurrency} expense records found.
                {currencies.length > 1 && (
                  <span> Switch to {currencies.filter((c) => c !== activeCurrency).join(" or ")} above to view data.</span>
                )}
              </div>
            ) : (
              <>
                {/* Top categories + Total */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-5 pb-4">
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Spend</p>
                      <p className="text-2xl font-bold mt-1">{formatAmount(totalSpend)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{categoryTotals.length} categories · {filtered.length} records</p>
                    </CardContent>
                  </Card>
                  {topCategories.slice(0, 2).map((cat, i) => (
                    <Card key={cat.name}>
                      <CardContent className="pt-5 pb-4">
                        <div className="flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">#{i + 1} Category</p>
                        </div>
                        <p className="text-lg font-bold mt-1 truncate">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">{formatAmount(cat.total)} · {totalSpend > 0 ? Math.round((cat.total / totalSpend) * 100) : 0}%</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Monthly trends */}
                {monthlyTrends.categories.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-muted-foreground" />
                        Monthly Trends – Top Categories ({activeCurrency})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={monthlyTrends.data} margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <YAxis tickFormatter={(v) => formatAmount(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                            <Tooltip
                              formatter={(value: number, name: string) => [formatAmount(value), name]}
                              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                            />
                            {monthlyTrends.categories.map((cat, i) => {
                              const color = categoryColorMap[cat] || COLORS[i % COLORS.length];
                              return (
                                <Line
                                  key={cat}
                                  type="monotone"
                                  dataKey={cat}
                                  stroke={color}
                                  strokeWidth={2}
                                  dot={{ r: 3, fill: color }}
                                />
                              );
                            })}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        {monthlyTrends.categories.map((cat, i) => (
                          <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <div className="h-2.5 w-2.5 rounded-full" style={{ background: categoryColorMap[cat] || COLORS[i % COLORS.length] }} />
                            {cat}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Monthly Budgets — shown regardless of currency filter */}
            {budgetedCategories.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Monthly Budgets ({now.toLocaleDateString("en-US", { month: "long", year: "numeric" })})
                  </CardTitle>
                  {currencies.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      Progress bar shows {activeCurrency} spend · other currencies shown below each bar
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {budgetedCategories.map((cat) => {
                    const actual = currentMonthActuals.get(cat.name) || 0;
                    const budget = cat.monthly_budget!;
                    const pct = Math.min((actual / budget) * 100, 100);
                    const over = actual > budget;
                    const allCurrencyBreakdown = currentMonthAllCurrencyActuals.get(cat.name);
                    const hasOtherCurrencies = allCurrencyBreakdown && allCurrencyBreakdown.size > 1;
                    return (
                      <div key={cat.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {cat.color && (
                              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                            )}
                            <span className="font-medium">{cat.name}</span>
                          </div>
                          <span className={`text-xs tabular-nums ${over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                            {formatAmount(actual)} / {formatAmount(budget)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${over ? "bg-destructive" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        {hasOtherCurrencies && (
                          <p className="text-[11px] text-muted-foreground">
                            This month across all currencies:{" "}
                            {Array.from(allCurrencyBreakdown!.entries())
                              .map(([cur, amt]) => formatAmount(amt, cur))
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
