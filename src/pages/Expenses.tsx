import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Receipt, Loader2 } from "lucide-react";
import { useState } from "react";
import { useExpenseRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const { data: expenses = [], isLoading } = useExpenseRecords();

  const filtered = expenses.filter((d) =>
    (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.invoice_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view expenses.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total expenses</p>
          <p className="text-2xl font-bold">€{total.toFixed(2)}</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No expense records yet. Upload and approve documents to create expense records.
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
                      <td className="p-3 text-sm">{doc.currency} {Number(doc.net_amount).toFixed(2)}</td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.currency} {Number(doc.vat_amount).toFixed(2)}</td>
                      <td className="p-3 text-sm font-medium">{doc.currency} {Number(doc.total_amount).toFixed(2)}</td>
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
