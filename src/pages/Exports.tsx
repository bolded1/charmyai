import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { mockDocuments } from "@/lib/mock-data";

export default function ExportsPage() {
  const [exportType, setExportType] = useState("expenses");
  const [format, setFormat] = useState("csv");

  const handleExport = () => {
    const docs = exportType === 'expenses'
      ? mockDocuments.filter((d) => d.type === 'expense_invoice' || d.type === 'receipt')
      : exportType === 'income'
      ? mockDocuments.filter((d) => d.type === 'sales_invoice')
      : mockDocuments;

    // Generate CSV
    const headers = ['Date', 'Supplier/Customer', 'Invoice #', 'Currency', 'Net Amount', 'VAT Amount', 'Total Amount', 'Category'];
    const rows = docs.map((d) => [
      d.date, d.supplier || d.customer || '', d.invoiceNumber, d.currency,
      d.netAmount.toFixed(2), d.vatAmount.toFixed(2), d.totalAmount.toFixed(2), d.category,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `doculedger-${exportType}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${exportType} exported as ${format.toUpperCase()}`);
  };

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

          <Button onClick={handleExport} className="w-full">
            <Download className="h-4 w-4 mr-2" /> Export Data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Exports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: "March Expenses", date: "Mar 14, 2024", type: "CSV", rows: 23 },
              { name: "Q1 Income", date: "Mar 10, 2024", type: "Excel", rows: 15 },
              { name: "February All", date: "Mar 1, 2024", type: "CSV", rows: 47 },
            ].map((exp) => (
              <div key={exp.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  {exp.type === 'CSV' ? <FileText className="h-4 w-4 text-muted-foreground" /> : <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">{exp.name}</p>
                    <p className="text-xs text-muted-foreground">{exp.date} · {exp.rows} rows</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
