import { useState } from "react";
import { adminDocuments } from "@/lib/admin-mock-data";
import type { AdminDocument } from "@/lib/admin-mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, FileText } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";

const statusColors: Record<string, string> = {
  processing: "bg-muted text-muted-foreground",
  needs_review: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

export default function AdminDocumentsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<AdminDocument | null>(null);
  const isMobile = useIsMobile();

  const filtered = adminDocuments.filter((d) => {
    const matchesSearch = d.fileName.toLowerCase().includes(search.toLowerCase()) || d.organization.toLowerCase().includes(search.toLowerCase()) || d.user.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMobile ? (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <MobileRecordCard
              key={doc.id}
              title={doc.fileName}
              subtitle={`${doc.organization} · ${doc.user}`}
              badge={{ label: doc.status.replace("_", " "), className: statusColors[doc.status] }}
              fields={[
                { label: "Type", value: doc.documentType.replace("_", " ") },
                { label: "Date", value: new Date(doc.uploadDate).toLocaleDateString() },
                { label: "Confidence", value: doc.confidence ? `${doc.confidence}%` : "—" },
                { label: "Processing", value: doc.processingTime ? `${doc.processingTime}s` : "—" },
              ]}
              onClick={() => setSelected(doc)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground">Document ID</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Organization</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">User</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">File</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Upload Date</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-mono text-muted-foreground">{doc.id}</td>
                      <td className="p-3 text-sm">{doc.organization}</td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.user}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]">{doc.fileName}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground capitalize">{doc.documentType.replace('_', ' ')}</td>
                      <td className="p-3"><Badge variant="secondary" className={`capitalize ${statusColors[doc.status]}`}>{doc.status.replace('_', ' ')}</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(doc)}><Eye className="h-3.5 w-3.5" /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Document Processing Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { l: "Document ID", v: selected.id },
                  { l: "File Name", v: selected.fileName },
                  { l: "Organization", v: selected.organization },
                  { l: "Uploaded By", v: selected.user },
                  { l: "Document Type", v: selected.documentType.replace('_', ' ') },
                  { l: "Status", v: selected.status.replace('_', ' ') },
                  { l: "Upload Date", v: new Date(selected.uploadDate).toLocaleString() },
                  { l: "Processing Time", v: selected.processingTime ? `${selected.processingTime}s` : '—' },
                  { l: "AI Confidence", v: selected.confidence ? `${selected.confidence}%` : '—' },
                ].map((f) => (
                  <div key={f.l}>
                    <p className="text-xs text-muted-foreground">{f.l}</p>
                    <p className="text-sm font-medium capitalize">{f.v}</p>
                  </div>
                ))}
              </div>
              {selected.confidence && selected.confidence < 80 && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  ⚠ Low confidence score. Manual review recommended.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
