import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";
import { TrendingUp, Trophy, BarChart3, CalendarRange } from "lucide-react";

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
  // Get unique currencies
  const currencies = useMemo(() => {
    const set = new Set(expenses.map((e) => e.currency));
    return Array.from(set).sort();
  }, [expenses]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>("");

  // Auto-select first currency
  const activeCurrency = selectedCurrency || currencies[0] || "EUR";

  // Filter expenses by selected currency
  const filtered = useMemo(
    () => expenses.filter((e) => e.currency === activeCurrency),
    [expenses, activeCurrency]
  );

  // ── Spending by category ──
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

  // ── Top categories ──
  const topCategories = categoryTotals.slice(0, 5);

  // ── Monthly trends (last 6 months) ──
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

    // Get top 4 categories for trend lines
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
    <div className="space-y-6">
      {/* Currency selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Category Analytics
        </h2>
        {currencies.length > 1 && (
          <Select value={activeCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {currencies.length === 1 && (
          <Badge variant="secondary" className="text-xs">{activeCurrency}</Badge>
        )}
      </div>

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

      {/* Spending by category bar chart */}
      {categoryTotals.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Spending by Category ({activeCurrency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryTotals.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" tickFormatter={(v) => formatAmount(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} />
                  <Tooltip
                    formatter={(value: number) => [formatAmount(value), "Total"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13 }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
}
