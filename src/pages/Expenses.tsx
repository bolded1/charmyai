import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Receipt, Loader2, CalendarIcon, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useExpenseRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";
import { cn } from "@/lib/utils";

type DatePreset = "all" | "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom";

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const { user } = useAuth();
  const { data: expenses = [], isLoading } = useExpenseRecords();

  // Compute date range from preset
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case "this_month":
        return { from: startOfMonth(now), to: endOfMonth(now) };
      case "last_month": {
        const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { from: startOfMonth(last), to: endOfMonth(last) };
      }
      case "this_quarter":
        return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case "this_year":
        return { from: startOfYear(now), to: endOfYear(now) };
      case "last_year": {
        const ly = new Date(now.getFullYear() - 1, 0, 1);
        return { from: startOfYear(ly), to: endOfYear(ly) };
      }
      case "custom":
        return { from: dateFrom, to: dateTo };
      default:
        return { from: undefined, to: undefined };
    }
  }, [datePreset, dateFrom, dateTo]);

  // Single filtered list used for both table AND totals
  const filtered = useMemo(() => {
    return expenses.filter((d) => {
      const matchesSearch =
        (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.invoice_number || "").toLowerCase().includes(search.toLowerCase());
      const matchesCurrency = currencyFilter === "all" || d.currency === currencyFilter;

      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const docDate = d.invoice_date ? new Date(d.invoice_date) : null;
        if (!docDate) {
          matchesDate = false;
        } else {
          if (dateRange.from && docDate < dateRange.from) matchesDate = false;
          if (dateRange.to && docDate > dateRange.to) matchesDate = false;
        }
      }

      return matchesSearch && matchesCurrency && matchesDate;
    });
  }, [expenses, search, currencyFilter, dateRange]);

  // Totals from filtered data
  const totalEur = filtered
    .filter((e) => e.currency === "EUR")
    .reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
  const totalUsd = filtered
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
  const eurCount = filtered.filter((e) => e.currency === "EUR").length;
  const usdCount = filtered.filter((e) => e.currency === "USD").length;

  const clearDateFilter = () => {
    setDatePreset("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view expenses.</div>;
  }

  const activeDateLabel = datePreset !== "all"
    ? datePreset === "custom"
      ? `${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "..."} – ${dateTo ? format(dateTo, "dd/MM/yyyy") : "..."}`
      : datePreset.replace("_", " ")
    : null;

  return (
    <div className="space-y-4">
      {/* Currency summary cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Expenses EUR</span>
              <Badge variant="outline" className="text-xs">EUR</Badge>
            </div>
            <div className="text-2xl font-bold">€{totalEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{eurCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Expenses USD</span>
              <Badge variant="outline" className="text-xs">USD</Badge>
            </div>
            <div className="text-2xl font-bold">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{usdCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
          <SelectTrigger className="w-40">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
            <SelectItem value="last_year">Last Year</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>

        {datePreset === "custom" && (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left text-xs", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left text-xs", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </>
        )}

        <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>

        {(datePreset !== "all" || currencyFilter !== "all" || search) && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { clearDateFilter(); setCurrencyFilter("all"); setSearch(""); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No expense records found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground">Supplier</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Category</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Currency</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Net</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">VAT</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.supplier_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.invoice_number || "—"}</td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.invoice_date}</td>
                      <td className="p-3"><Badge variant="secondary" className="text-xs">{doc.category || "—"}</Badge></td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{doc.currency}</Badge></td>
                      <td className="p-3 text-sm">{Number(doc.net_amount).toFixed(2)}</td>
                      <td className="p-3 text-sm text-muted-foreground">{Number(doc.vat_amount).toFixed(2)}</td>
                      <td className="p-3 text-sm font-medium">{Number(doc.total_amount).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
