import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2, CalendarIcon } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useExpenseRecords, useIncomeRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { exportToPdf } from "@/lib/pdf-export";

const MONTHS = [
  { value: "01", label: "Jan", full: "January" },
  { value: "02", label: "Feb", full: "February" },
  { value: "03", label: "Mar", full: "March" },
  { value: "04", label: "Apr", full: "April" },
  { value: "05", label: "May", full: "May" },
  { value: "06", label: "Jun", full: "June" },
  { value: "07", label: "Jul", full: "July" },
  { value: "08", label: "Aug", full: "August" },
  { value: "09", label: "Sep", full: "September" },
  { value: "10", label: "Oct", full: "October" },
  { value: "11", label: "Nov", full: "November" },
  { value: "12", label: "Dec", full: "December" },
];

function MonthMultiSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);
  };

  const label = selected.length === 0
    ? "All Months"
    : selected.length <= 3
      ? selected.map((v) => MONTHS.find((m) => m.value === v)?.label).join(", ")
      : `${selected.length} months`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className={selected.length === 0 ? "text-muted-foreground" : ""}>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-3 pointer-events-auto" align="start">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Select months</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => onChange([])}>
            Clear
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {MONTHS.map((m) => (
            <label
              key={m.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm"
            >
              <Checkbox
                checked={selected.includes(m.value)}
                onCheckedChange={() => toggle(m.value)}
              />
              {m.full}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function buildSubtitle(year: string, months: string[], currency: string) {
  const parts: string[] = [];
  if (year !== "all") parts.push(year);
  if (months.length > 0) parts.push(months.map((v) => MONTHS.find((m) => m.value === v)?.full).join(", "));
  if (currency !== "all") parts.push(currency);
  return parts.length > 0 ? parts.join(" · ") : "All records";
}

function buildFileName(type: string, year: string, months: string[], currency: string, format: string) {
  const parts: string[] = [type];
  if (currency !== "all") parts.push(currency);
  if (year !== "all") parts.push(year);
  if (months.length > 0) parts.push(months.map((v) => MONTHS.find((m) => m.value === v)?.label).join("-"));
  const ext = format === "excel" ? "xls" : format;
  return `charmy-${parts.join("-")}-export.${ext}`;
}

function fmt(n: number | null | undefined) {
  return Number(n || 0).toFixed(2);
}

function fmtCurrency(n: number, cur: string) {
  return `${cur === "USD" ? "$" : "€"}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadCsvOrExcel(headers: string[], rows: string[][], fileName: string, format: "csv" | "excel") {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const mime = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
  const blob = new Blob([csv], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportsPage() {
  const [format, setFormat] = useState("pdf");
  const [currency, setCurrency] = useState("all");
  const [expMonths, setExpMonths] = useState<string[]>([]);
  const [expYear, setExpYear] = useState("all");
  const [exporting, setExporting] = useState(false);

  const [incomeFormat, setIncomeFormat] = useState("pdf");
  const [incomeCurrency, setIncomeCurrency] = useState("all");
  const [incomeMonths, setIncomeMonths] = useState<string[]>([]);
  const [incomeYear, setIncomeYear] = useState("all");
  const [exportingIncome, setExportingIncome] = useState(false);

  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { data: expenses = [] } = useExpenseRecords();
  const { data: income = [] } = useIncomeRecords();

  const incomeYears = useMemo(() => {
    const years = new Set<string>();
    income.forEach((r) => { if (r.invoice_date) years.add(r.invoice_date.slice(0, 4)); });
    return Array.from(years).sort().reverse();
  }, [income]);

  const expenseYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach((r) => { if (r.invoice_date) years.add(r.invoice_date.slice(0, 4)); });
    return Array.from(years).sort().reverse();
  }, [expenses]);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    try {
      let records = currency === "all" ? expenses : expenses.filter((e) => e.currency === currency);
      if (expYear !== "all") records = records.filter((r) => r.invoice_date?.startsWith(expYear));
      if (expMonths.length > 0) records = records.filter((r) => expMonths.includes(r.invoice_date?.slice(5, 7) || ""));

      const headers = ["Date", "Due Date", "Supplier", "Invoice #", "VAT Number", "Currency", "Net Amount", "VAT Amount", "Total Amount", "Category"];
      const rows = records.map((d) => [
        d.invoice_date || "", d.due_date || "", d.supplier_name || "", d.invoice_number || "",
        d.vat_number || "", d.currency || "EUR", fmt(d.net_amount), fmt(d.vat_amount), fmt(d.total_amount), d.category || "",
      ]);

      const fileName = buildFileName("expenses", expYear, expMonths, currency, format);

      if (format === "pdf") {
        const totalNet = records.reduce((s, r) => s + Number(r.net_amount || 0), 0);
        const totalVat = records.reduce((s, r) => s + Number(r.vat_amount || 0), 0);
        const totalAmount = records.reduce((s, r) => s + Number(r.total_amount || 0), 0);
        const cur = currency !== "all" ? currency : "EUR";

        exportToPdf({
          title: "Expense Report",
          subtitle: buildSubtitle(expYear, expMonths, currency),
          headers,
          rows,
          fileName,
          summaryRows: [
            { label: "NET TOTAL", value: fmtCurrency(totalNet, cur) },
            { label: "VAT TOTAL", value: fmtCurrency(totalVat, cur) },
            { label: "GRAND TOTAL", value: fmtCurrency(totalAmount, cur) },
          ],
        });
      } else {
        downloadCsvOrExcel(headers, rows, fileName, format as "csv" | "excel");
      }

      await supabase.from("export_history").insert({
        user_id: user.id,
        organization_id: activeWorkspace?.id || null,
        export_name: `Expenses Export`,
        export_type: "expenses",
        format,
        row_count: rows.length,
      });

      const docIds = records.filter((e) => e.document_id).map((e) => e.document_id);
      if (docIds.length > 0) await supabase.from("documents").update({ status: "exported" }).in("id", docIds);

      toast.success(`${rows.length} records exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportIncome = async () => {
    if (!user) return;
    setExportingIncome(true);

    try {
      let records = income;
      if (incomeCurrency !== "all") records = records.filter((r) => r.currency === incomeCurrency);
      if (incomeYear !== "all") records = records.filter((r) => r.invoice_date?.startsWith(incomeYear));
      if (incomeMonths.length > 0) records = records.filter((r) => incomeMonths.includes(r.invoice_date?.slice(5, 7) || ""));

      const headers = ["Date", "Due Date", "Customer", "Invoice #", "VAT Number", "Currency", "Net Amount", "VAT Amount", "Total Amount", "Category"];
      const rows = records.map((d) => [
        d.invoice_date || "", d.due_date || "", d.customer_name || "", d.invoice_number || "",
        d.vat_number || "", d.currency || "EUR", fmt(d.net_amount), fmt(d.vat_amount), fmt(d.total_amount), d.category || "",
      ]);

      const fileName = buildFileName("income", incomeYear, incomeMonths, incomeCurrency, incomeFormat);

      if (incomeFormat === "pdf") {
        const totalNet = records.reduce((s, r) => s + Number(r.net_amount || 0), 0);
        const totalVat = records.reduce((s, r) => s + Number(r.vat_amount || 0), 0);
        const totalAmount = records.reduce((s, r) => s + Number(r.total_amount || 0), 0);
        const cur = incomeCurrency !== "all" ? incomeCurrency : "EUR";

        exportToPdf({
          title: "Income Report",
          subtitle: buildSubtitle(incomeYear, incomeMonths, incomeCurrency),
          headers,
          rows,
          fileName,
          summaryRows: [
            { label: "NET TOTAL", value: fmtCurrency(totalNet, cur) },
            { label: "VAT TOTAL", value: fmtCurrency(totalVat, cur) },
            { label: "GRAND TOTAL", value: fmtCurrency(totalAmount, cur) },
          ],
        });
      } else {
        downloadCsvOrExcel(headers, rows, fileName, incomeFormat as "csv" | "excel");
      }

      await supabase.from("export_history").insert({
        user_id: user.id,
        organization_id: activeWorkspace?.id || null,
        export_name: `Income Export`,
        export_type: "income",
        format: incomeFormat,
        row_count: rows.length,
      });

      const docIds = records.filter((r) => r.document_id).map((r) => r.document_id);
      if (docIds.length > 0) await supabase.from("documents").update({ status: "exported" }).in("id", docIds);

      toast.success(`${rows.length} income records exported as ${incomeFormat.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExportingIncome(false);
    }
  };

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to export data.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Export Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={expYear} onValueChange={setExpYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {expenseYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Months</label>
              <MonthMultiSelect selected={expMonths} onChange={setExpMonths} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleExport} className="w-full" disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Expenses as {format.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      {/* Export Income */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={incomeYear} onValueChange={setIncomeYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {incomeYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Months</label>
              <MonthMultiSelect selected={incomeMonths} onChange={setIncomeMonths} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Select value={incomeCurrency} onValueChange={setIncomeCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={incomeFormat} onValueChange={setIncomeFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleExportIncome} className="w-full" disabled={exportingIncome}>
            {exportingIncome ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Income as {incomeFormat.toUpperCase()}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
