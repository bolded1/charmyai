import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useExpenseRecords, useIncomeRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ExportsPage() {
  const [exportType, setExportType] = useState("expenses");
  const [format, setFormat] = useState("csv");
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const { data: expenses = [] } = useExpenseRecords();
  const { data: income = [] } = useIncomeRecords();

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    try {
      const records = exportType === "expenses" ? expenses : exportType === "income" ? income : [...expenses, ...income];

      const headers = ["Date", "Supplier/Customer", "Invoice #", "Currency", "Net Amount", "VAT Amount", "Total Amount", "Category"];
      const rows = records.map((d: any) => [
        d.invoice_date || "",
        d.supplier_name || d.customer_name || "",
        d.invoice_number || "",
        d.currency || "EUR",
        Number(d.net_amount || 0).toFixed(2),
        Number(d.vat_amount || 0).toFixed(2),
        Number(d.total_amount || 0).toFixed(2),
        d.category || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

      if (format === "csv") {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `doculedger-${exportType}-export.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // For Excel, we export as CSV with .xls extension (basic compatibility)
        const blob = new Blob([csv], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `doculedger-${exportType}-export.xls`;
        a.click();
        URL.revokeObjectURL(url);
      }

      // Log export
      await supabase.from("export_history").insert({
        user_id: user.id,
        export_name: `${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Export`,
        export_type: exportType,
        format,
        row_count: rows.length,
      });

      // Mark exported documents
      if (exportType === "expenses" || exportType === "all") {
        const docIds = expenses.filter((e) => e.document_id).map((e) => e.document_id);
        if (docIds.length > 0) {
          await supabase.from("documents").update({ status: "exported" }).in("id", docIds);
        }
      }
      if (exportType === "income" || exportType === "all") {
        const docIds = income.filter((e) => e.document_id).map((e) => e.document_id);
        if (docIds.length > 0) {
          await supabase.from("documents").update({ status: "exported" }).in("id", docIds);
        }
      }

      toast.success(`${rows.length} records exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to export data.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Accounting Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Export Type</label>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expenses">Expenses</SelectItem>
                  <SelectItem value="income">Income Invoices</SelectItem>
                  <SelectItem value="all">All Transactions</SelectItem>
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
            Export Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
