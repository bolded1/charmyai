import { mockDocuments } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Search, Filter, Eye } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { Document } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  processing: "bg-muted text-muted-foreground",
  needs_review: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  exported: "bg-secondary text-secondary-foreground",
};

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Document | null>(null);

  const filtered = mockDocuments.filter((d) => {
    const matchesSearch = d.fileName.toLowerCase().includes(search.toLowerCase()) ||
      (d.supplier || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.customer || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="exported">Exported</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">Document</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Supplier/Customer</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium truncate max-w-[200px]">{doc.fileName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground capitalize">{doc.type.replace('_', ' ')}</td>
                    <td className="p-3 text-sm">{doc.supplier || doc.customer || '—'}</td>
                    <td className="p-3 text-sm text-muted-foreground">{doc.date}</td>
                    <td className="p-3 text-sm font-medium">
                      {doc.totalAmount > 0 ? `${doc.currency} ${doc.totalAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className={statusColors[doc.status]}>
                        {doc.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Document Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "File", value: selected.fileName },
                  { label: "Type", value: selected.type.replace('_', ' ') },
                  { label: "Supplier/Customer", value: selected.supplier || selected.customer || '—' },
                  { label: "Invoice #", value: selected.invoiceNumber || '—' },
                  { label: "Date", value: selected.date },
                  { label: "Due Date", value: selected.dueDate || '—' },
                  { label: "Currency", value: selected.currency },
                  { label: "Net Amount", value: selected.netAmount.toFixed(2) },
                  { label: "VAT Amount", value: selected.vatAmount.toFixed(2) },
                  { label: "Total Amount", value: selected.totalAmount.toFixed(2) },
                  { label: "VAT Number", value: selected.vatNumber || '—' },
                  { label: "Category", value: selected.category || '—' },
                ].map((f) => (
                  <div key={f.label}>
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <p className="text-sm font-medium capitalize">{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">Edit</Button>
                <Button size="sm" className="flex-1">Approve</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
