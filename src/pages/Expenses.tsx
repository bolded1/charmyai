import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Receipt, Loader2 } from "lucide-react";
import { useState } from "react";
import { useExpenseRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const { user } = useAuth();
  const { data: expenses = [], isLoading } = useExpenseRecords();

  const filtered = expenses.filter((d) => {
    const matchesSearch =
      (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.invoice_number || "").toLowerCase().includes(search.toLowerCase());
    const matchesCurrency = currencyFilter === "all" || d.currency === currencyFilter;
    return matchesSearch && matchesCurrency;
  });

  // Totals by currency
  const totalEur = expenses
    .filter((e) => e.currency === "EUR")
    .reduce((sum, e) => sum + Number(e.total_amount || 0), 0);
  const totalUsd = expenses
    .filter((e) => e.currency === "USD")
    .reduce((sum, e) => sum + Number(e.total_amount || 0), 0);

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view expenses.</div>;
  }

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
            <p className="text-xs text-muted-foreground mt-1">{expenses.filter(e => e.currency === "EUR").length} records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Expenses USD</span>
              <Badge variant="outline" className="text-xs">USD</Badge>
            </div>
            <div className="text-2xl font-bold">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{expenses.filter(e => e.currency === "USD").length} records</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
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
