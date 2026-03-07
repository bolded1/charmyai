import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useExpenseRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export default function ExportsPage() {
  const [format, setFormat] = useState("csv");
  const [currency, setCurrency] = useState("all");
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const { data: expenses = [] } = useExpenseRecords();

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);

    try {
      const records = currency === "all" ? expenses : expenses.filter((e) => e.currency === currency);

      const headers = ["Date", "Supplier", "Invoice #", "Currency", "Net Amount", "VAT Amount", "Total Amount", "Category"];
      const rows = records.map((d: any) => [
        d.invoice_date || "",
        d.supplier_name || "",
        d.invoice_number || "",
        d.currency || "EUR",
        Number(d.net_amount || 0).toFixed(2),
        Number(d.vat_amount || 0).toFixed(2),
        Number(d.total_amount || 0).toFixed(2),
        d.category || "",
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
      const ext = format === "csv" ? "csv" : "xls";
      const mime = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
      const suffix = currency !== "all" ? `-${currency}` : "";

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

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to export data.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
    </div>
  );
}
