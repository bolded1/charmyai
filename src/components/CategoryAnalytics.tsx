import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { Trophy, BarChart3, CalendarRange, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ExpenseRecord {
  category: string | null;
  currency: string;
  total_amount: number;
  invoice_date: string;
}

interface CategoryAnalyticsProps {
  expenses: ExpenseRecord[];
  isLoading: boolean;
}

export default function CategoryAnalytics({ expenses, isLoading }: CategoryAnalyticsProps) {
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

  const formatAmount = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: activeCurrency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

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
              <div className="flex items-center gap-3">
                {currencies.length === 1 && (
                  <Badge variant="secondary" className="text-xs">{activeCurrency}</Badge>
                )}
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-0">
            {/* Currency selector */}
            {currencies.length > 1 && (
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 mt-1">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
                  <span className="text-sm font-semibold text-primary">$</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-muted-foreground">Display Currency</span>
                  <Select value={activeCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className="w-[150px] h-8 text-sm font-medium border-none shadow-none p-0 focus:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

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
                        {monthlyTrends.categories.map((cat, i) => (
                          <Line
                            key={cat}
                            type="monotone"
                            dataKey={cat}
                            stroke={COLORS[i % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 3, fill: COLORS[i % COLORS.length] }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {monthlyTrends.categories.map((cat, i) => (
                      <div key={cat} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        {cat}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}