import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, subMonths, subQuarters, subYears,
  eachMonthOfInterval, format, isWithinInterval, parseISO,
} from "date-fns";
import { TrendingUp, TrendingDown, Minus, FileText, Download, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseRecords, useIncomeRecords } from "@/hooks/useDocuments";
import { exportToPdf } from "@/lib/pdf-export";
import { useTranslation } from "react-i18next";

// ─── Date Presets ─────────────────────────────────────────────────────────────
type Preset = "this_month" | "last_month" | "this_quarter" | "last_quarter" | "this_year" | "last_year";

function getDateRange(preset: Preset): { start: Date; end: Date } {
  const now = new Date();
  switch (preset) {
    case "this_month":   return { start: startOfMonth(now), end: endOfMonth(now) };
    case "last_month":   return { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };
    case "this_quarter": return { start: startOfQuarter(now), end: endOfQuarter(now) };
    case "last_quarter": return { start: startOfQuarter(subQuarters(now, 1)), end: endOfQuarter(subQuarters(now, 1)) };
    case "this_year":    return { start: startOfYear(now), end: endOfYear(now) };
    case "last_year":    return { start: startOfYear(subYears(now, 1)), end: endOfYear(subYears(now, 1)) };
  }
}

const PRESET_LABELS: Record<Preset, string> = {
  this_month:   "This Month",
  last_month:   "Last Month",
  this_quarter: "This Quarter",
  last_quarter: "Last Quarter",
  this_year:    "This Year",
  last_year:    "Last Year",
};

// ─── Colours ──────────────────────────────────────────────────────────────────
const INCOME_COLOR  = "hsl(152 63% 32%)";
const EXPENSE_COLOR = "hsl(350 75% 55%)";
const PROFIT_COLOR  = "hsl(38 92% 50%)";

const PIE_COLORS = [
  "hsl(152 63% 32%)", "hsl(188 100% 28%)", "hsl(38 92% 50%)",
  "hsl(265 55% 55%)", "hsl(350 75% 55%)", "hsl(152 40% 55%)",
  "hsl(220 70% 50%)", "hsl(20 80% 50%)",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number, currency: string) {
  return n.toLocaleString(undefined, { style: "currency", currency, minimumFractionDigits: 2 });
}

function groupByCategory(records: any[], key: "total_amount" | "net_amount") {
  const map: Record<string, number> = {};
  for (const r of records) {
    const cat = r.category || "Uncategorised";
    map[cat] = (map[cat] || 0) + (r[key] ?? 0);
  }
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, trend, dark = false, i,
}: { label: string; value: string; sub?: string; trend?: "up" | "down" | "neutral"; dark?: boolean; i: number }) {
  const Icon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = dark ? "text-white/70" : trend === "up" ? "text-success" : trend === "down" ? "text-rose" : "text-muted-foreground";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className={dark ? "!bg-[hsl(152_63%_22%)] !shadow-lg text-white" : ""}>
        <CardContent className="p-5">
          <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${dark ? "text-white/70" : "text-muted-foreground"}`}>{label}</p>
          <p className={`text-2xl font-bold tracking-tight mb-1 ${dark ? "text-white" : "text-foreground"}`}>{value}</p>
          {sub && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
              <Icon className="h-3.5 w-3.5" />
              <span>{sub}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border/50 rounded-xl shadow-theme-lg p-3 text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="h-2 w-2 rounded-full inline-block" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold text-foreground">{fmt(p.value, currency)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Reports() {
  const { t } = useTranslation();
  const [preset, setPreset] = useState<Preset>("this_year");
  const [currency, setCurrency] = useState<string | null>(null);

  const { data: rawExpenses = [], isLoading: expLoading } = useExpenseRecords();
  const { data: rawIncome   = [], isLoading: incLoading } = useIncomeRecords();
  const isLoading = expLoading || incLoading;

  // Collect all currencies
  const currencies = useMemo(() => {
    const set = new Set<string>();
    [...rawExpenses, ...rawIncome].forEach((r) => r.currency && set.add(r.currency));
    return Array.from(set).sort();
  }, [rawExpenses, rawIncome]);

  // Set default currency when data loads
  const activeCurrency = currency ?? (currencies[0] ?? "EUR");

  // Filter by date range + currency
  const { start, end } = getDateRange(preset);
  const interval = { start, end };

  const expenses = useMemo(() =>
    rawExpenses.filter((r) =>
      r.currency === activeCurrency &&
      r.invoice_date &&
      isWithinInterval(parseISO(r.invoice_date), interval)
    ), [rawExpenses, activeCurrency, preset]);

  const income = useMemo(() =>
    rawIncome.filter((r) =>
      r.currency === activeCurrency &&
      r.invoice_date &&
      isWithinInterval(parseISO(r.invoice_date), interval)
    ), [rawIncome, activeCurrency, preset]);

  // Summary totals
  const totalRevenue  = useMemo(() => income.reduce((s, r)   => s + (Number(r.total_amount) || 0), 0), [income]);
  const totalExpenses = useMemo(() => expenses.reduce((s, r) => s + (Number(r.total_amount) || 0), 0), [expenses]);
  const grossProfit   = totalRevenue - totalExpenses;
  const vatBalance    = useMemo(() =>
    income.reduce((s, r) => s + (Number(r.vat_amount) || 0), 0) -
    expenses.reduce((s, r) => s + (Number(r.vat_amount) || 0), 0),
  [income, expenses]);

  // Monthly chart data
  const months = eachMonthOfInterval({ start, end });
  const monthlyData = useMemo(() => months.map((m) => {
    const mStart = startOfMonth(m);
    const mEnd   = endOfMonth(m);
    const mInter = { start: mStart, end: mEnd };

    const rev = income.filter((r) => r.invoice_date && isWithinInterval(parseISO(r.invoice_date), mInter))
      .reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
    const exp = expenses.filter((r) => r.invoice_date && isWithinInterval(parseISO(r.invoice_date), mInter))
      .reduce((s, r) => s + (Number(r.total_amount) || 0), 0);

    return { month: format(m, months.length > 6 ? "MMM" : "MMM yyyy"), Revenue: rev, Expenses: exp, Profit: rev - exp };
  }), [income, expenses, preset]);

  // Category breakdowns
  const incomeCats  = useMemo(() => groupByCategory(income,   "net_amount"), [income]);
  const expenseCats = useMemo(() => groupByCategory(expenses, "net_amount"), [expenses]);

  // Export handlers
  function handleExportPdf() {
    const rows: string[][] = [];
    rows.push(["", "Net", "VAT", "Total"]);
    rows.push(["INCOME", "", "", ""]);
    incomeCats.forEach((c) => {
      const records = income.filter((r) => (r.category || "Uncategorised") === c.name);
      const net = records.reduce((s, r) => s + (r.net_amount ?? 0), 0);
      const vat = records.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
      const tot = records.reduce((s, r) => s + (r.total_amount ?? 0), 0);
      rows.push([c.name, fmt(net, activeCurrency), fmt(vat, activeCurrency), fmt(tot, activeCurrency)]);
    });
    rows.push(["Total Revenue", "", "", fmt(totalRevenue, activeCurrency)]);
    rows.push(["EXPENSES", "", "", ""]);
    expenseCats.forEach((c) => {
      const records = expenses.filter((r) => (r.category || "Uncategorised") === c.name);
      const net = records.reduce((s, r) => s + (r.net_amount ?? 0), 0);
      const vat = records.reduce((s, r) => s + (r.vat_amount ?? 0), 0);
      const tot = records.reduce((s, r) => s + (r.total_amount ?? 0), 0);
      rows.push([c.name, fmt(net, activeCurrency), fmt(vat, activeCurrency), fmt(tot, activeCurrency)]);
    });
    rows.push(["Total Expenses", "", "", fmt(totalExpenses, activeCurrency)]);
    rows.push(["NET PROFIT / LOSS", "", "", fmt(grossProfit, activeCurrency)]);

    exportToPdf({
      title: "Profit & Loss Statement",
      subtitle: `${PRESET_LABELS[preset]} · ${activeCurrency}`,
      headers: ["Item", "Net", "VAT", "Total"],
      rows: rows.filter((r) => r[0] !== ""),
      fileName: `pl-report-${format(new Date(), "yyyy-MM-dd")}.pdf`,
      summaryRows: [
        { label: "Total Revenue",  value: fmt(totalRevenue,  activeCurrency) },
        { label: "Total Expenses", value: fmt(totalExpenses, activeCurrency) },
        { label: "Gross Profit",   value: fmt(grossProfit,   activeCurrency) },
        { label: "VAT Balance",    value: fmt(vatBalance,    activeCurrency) },
      ],
    });
  }

  function handleExportCsv() {
    const rows: string[][] = [
      ["Type", "Category", "Supplier / Customer", "Date", "Net", "VAT", "Total", "Currency"],
    ];
    income.forEach((r) =>
      rows.push(["Income", r.category ?? "", r.customer_name ?? "", r.invoice_date ?? "",
        String(r.net_amount), String(r.vat_amount), String(r.total_amount), r.currency])
    );
    expenses.forEach((r) =>
      rows.push(["Expense", r.category ?? "", r.supplier_name ?? "", r.invoice_date ?? "",
        String(r.net_amount), String(r.vat_amount), String(r.total_amount), r.currency])
    );
    downloadCsv(rows, `pl-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
  }

  const profitTrend = grossProfit > 0 ? "up" : grossProfit < 0 ? "down" : "neutral";

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold">Profit &amp; Loss</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Financial summary for selected period</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Currency pills */}
          {currencies.length > 1 && (
            <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1">
              {currencies.map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    c === activeCurrency ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Date preset */}
          <Select value={preset} onValueChange={(v) => setPreset(v as Preset)}>
            <SelectTrigger className="h-9 w-40 text-xs font-medium rounded-full border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PRESET_LABELS) as Preset[]).map((p) => (
                <SelectItem key={p} value={p} className="text-xs">{PRESET_LABELS[p]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
                <ChevronDown className="h-3 w-3 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="h-3.5 w-3.5 mr-2" /> Export PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCsv}>
                <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard i={0} dark label="Total Revenue"  value={fmt(totalRevenue,  activeCurrency)} sub={`${income.length} record${income.length !== 1 ? "s" : ""}`}   trend="up" />
          <StatCard i={1}      label="Total Expenses" value={fmt(totalExpenses, activeCurrency)} sub={`${expenses.length} record${expenses.length !== 1 ? "s" : ""}`} trend="down" />
          <StatCard i={2}      label="Gross Profit"   value={fmt(grossProfit,   activeCurrency)} trend={profitTrend} sub={grossProfit >= 0 ? "Profitable" : "Loss"} />
          <StatCard i={3}      label="VAT Balance"    value={fmt(vatBalance,    activeCurrency)} trend={vatBalance >= 0 ? "up" : "down"} sub="Net VAT position" />
        </div>
      )}

      {/* Monthly Trend Chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={monthlyData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip content={<ChartTooltip currency={activeCurrency} />} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                  <Bar dataKey="Revenue"  fill={INCOME_COLOR}  radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Expenses" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Line dataKey="Profit" stroke={PROFIT_COLOR} strokeWidth={2.5} dot={false} type="monotone" />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Category Breakdowns */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22 }}
        className="grid md:grid-cols-2 gap-4"
      >
        {([
          { title: "Revenue by Category", cats: incomeCats, color: INCOME_COLOR },
          { title: "Expenses by Category", cats: expenseCats, color: EXPENSE_COLOR },
        ] as const).map(({ title, cats }) => (
          <Card key={title}>
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold">{title}</CardTitle></CardHeader>
            <CardContent className="pt-0">
              {isLoading ? <Skeleton className="h-48 rounded-xl" /> : cats.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">No data</p>
              ) : (
                <div className="flex items-center gap-4">
                  <PieChart width={130} height={130}>
                    <Pie data={cats} dataKey="value" cx={60} cy={60} innerRadius={36} outerRadius={58} paddingAngle={2} stroke="none">
                      {cats.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {cats.slice(0, 6).map((c, idx) => {
                      const total = cats.reduce((s, x) => s + x.value, 0);
                      const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
                      return (
                        <div key={c.name} className="flex items-center gap-2 text-xs">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                          <span className="truncate text-foreground flex-1 min-w-0">{c.name}</span>
                          <span className="text-muted-foreground shrink-0">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* P&L Statement Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">P&amp;L Statement</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)}
              </div>
            ) : (
              <div className="text-sm">
                {/* Income section */}
                <PLSection title="INCOME" rows={incomeCats} records={income} currency={activeCurrency} subtotalLabel="Total Revenue" subtotal={totalRevenue} color="text-success" />
                <div className="h-px bg-border/50 my-2" />
                {/* Expenses section */}
                <PLSection title="EXPENSES" rows={expenseCats} records={expenses} currency={activeCurrency} subtotalLabel="Total Expenses" subtotal={totalExpenses} color="text-rose" />
                {/* Net totals */}
                <div className="h-px bg-border my-3" />
                <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-muted/50">
                  <span className="font-bold text-foreground">NET PROFIT / LOSS</span>
                  <span className={`font-bold text-base ${grossProfit >= 0 ? "text-success" : "text-rose"}`}>
                    {fmt(grossProfit, activeCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between px-3 py-2 mt-1 text-muted-foreground">
                  <span className="font-medium">VAT Balance</span>
                  <span className="font-semibold">{fmt(vatBalance, activeCurrency)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── P&L Table Section ────────────────────────────────────────────────────────
function PLSection({
  title, rows, records, currency, subtotalLabel, subtotal, color,
}: {
  title: string;
  rows: { name: string; value: number }[];
  records: any[];
  currency: string;
  subtotalLabel: string;
  subtotal: number;
  color: string;
}) {
  return (
    <div className="mb-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 px-3 py-2">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground px-3 pb-2">No records</p>
      ) : rows.map((row) => {
        const recs  = records.filter((r) => (r.category || "Uncategorised") === row.name);
        const net   = recs.reduce((s, r) => s + (r.net_amount   ?? 0), 0);
        const vat   = recs.reduce((s, r) => s + (r.vat_amount   ?? 0), 0);
        const total = recs.reduce((s, r) => s + (r.total_amount ?? 0), 0);
        return (
          <div key={row.name} className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 px-3 py-1.5 rounded-lg hover:bg-muted/40 transition-colors">
            <span className="text-foreground/80 truncate">{row.name}</span>
            <span className="text-muted-foreground text-right tabular-nums">{fmt(net, currency)}</span>
            <span className="text-muted-foreground text-right tabular-nums">+{fmt(vat, currency)}</span>
            <span className="font-medium text-foreground text-right tabular-nums">{fmt(total, currency)}</span>
          </div>
        );
      })}
      <div className={`flex items-center justify-between px-3 py-2 font-semibold ${color} mt-1`}>
        <span>{subtotalLabel}</span>
        <span className="tabular-nums">{fmt(subtotal, currency)}</span>
      </div>
    </div>
  );
}
