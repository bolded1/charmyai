import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useExpenseRecords, useIncomeRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ExportsPage() {
  const [format, setFormat] = useState("csv");
  const [currency, setCurrency] = useState("all");
  const [expMonth, setExpMonth] = useState("all");
  const [expYear, setExpYear] = useState("all");
  const [exporting, setExporting] = useState(false);

  const [incomeFormat, setIncomeFormat] = useState("csv");
  const [incomeCurrency, setIncomeCurrency] = useState("all");
  const [incomeMonth, setIncomeMonth] = useState("all");
  const [incomeYear, setIncomeYear] = useState("all");
  const [exportingIncome, setExportingIncome] = useState(false);

  const { user } = useAuth();
  const { data: expenses = [] } = useExpenseRecords();
  const { data: income = [] } = useIncomeRecords();

  // Derive available years from income records
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

  const months = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    try {
      let records = currency === "all" ? expenses : expenses.filter((e) => e.currency === currency);
      if (expYear !== "all") records = records.filter((r) => r.invoice_date?.startsWith(expYear));
      if (expMonth !== "all") records = records.filter((r) => r.invoice_date?.slice(5, 7) === expMonth);

      const headers = [
        "Date", "Due Date", "Supplier", "Invoice #", "VAT Number",
        "Currency", "Net Amount", "VAT Amount", "Total Amount", "Category"
      ];
      const rows = records.map((d: any) => [
        d.invoice_date || "",
        d.due_date || "",
        d.supplier_name || "",
        d.invoice_number || "",
        d.vat_number || "",
        d.currency || "EUR",
        Number(d.net_amount || 0).toFixed(2),
        Number(d.vat_amount || 0).toFixed(2),
        Number(d.total_amount || 0).toFixed(2),
        d.category || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
      const ext = format === "csv" ? "csv" : "xls";
      const mime = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
      const parts: string[] = [];
      if (currency !== "all") parts.push(currency);
      if (expYear !== "all") parts.push(expYear);
      if (expMonth !== "all") parts.push(months.find((m) => m.value === expMonth)?.label || expMonth);
      const suffix = parts.length > 0 ? `-${parts.join("-")}` : "";

      const blob = new Blob([csv], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `doculedger-expenses${suffix}-export.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      await supabase.from("export_history").insert({
        user_id: user.id,
        export_name: `Expenses${suffix} Export`,
        export_type: "expenses",
        format,
        row_count: rows.length,
      });

      const docIds = records.filter((e) => e.document_id).map((e) => e.document_id);
      if (docIds.length > 0) {
        await supabase.from("documents").update({ status: "exported" }).in("id", docIds);
      }

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
      if (incomeMonth !== "all") records = records.filter((r) => {
        const m = r.invoice_date?.slice(5, 7);
        return m === incomeMonth;
      });

      const headers = [
        "Date", "Due Date", "Customer", "Invoice #", "VAT Number",
        "Currency", "Net Amount", "VAT Amount", "Total Amount", "Category"
      ];
      const rows = records.map((d: any) => [
        d.invoice_date || "",
        d.due_date || "",
        d.customer_name || "",
        d.invoice_number || "",
        d.vat_number || "",
        d.currency || "EUR",
        Number(d.net_amount || 0).toFixed(2),
        Number(d.vat_amount || 0).toFixed(2),
        Number(d.total_amount || 0).toFixed(2),
        d.category || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
      const ext = incomeFormat === "csv" ? "csv" : "xls";
      const mime = incomeFormat === "csv" ? "text/csv" : "application/vnd.ms-excel";

      const parts: string[] = [];
      if (incomeCurrency !== "all") parts.push(incomeCurrency);
      if (incomeYear !== "all") parts.push(incomeYear);
      if (incomeMonth !== "all") parts.push(months.find((m) => m.value === incomeMonth)?.label || incomeMonth);
      const suffix = parts.length > 0 ? `-${parts.join("-")}` : "";

      const blob = new Blob([csv], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `doculedger-income${suffix}-export.${ext}`;
      a.click();
      URL.revokeObjectURL(url);

      await supabase.from("export_history").insert({
        user_id: user.id,
        export_name: `Income${suffix} Export`,
        export_type: "income",
        format: incomeFormat,
        row_count: rows.length,
      });

      const docIds = records.filter((r) => r.document_id).map((r) => r.document_id);
      if (docIds.length > 0) {
        await supabase.from("documents").update({ status: "exported" }).in("id", docIds);
      }

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
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleExport} className="w-full" disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Expenses
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
              <label className="text-sm font-medium">Month</label>
              <Select value={incomeMonth} onValueChange={setIncomeMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleExportIncome} className="w-full" disabled={exportingIncome}>
            {exportingIncome ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Income
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
