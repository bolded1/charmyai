import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Eye, FileText, Loader2, RefreshCw, Download, Image as ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  processing: "bg-muted text-muted-foreground",
  processed: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

const isImageType = (type: string) => type?.startsWith("image/");
const isPdfType = (type: string) => type === "application/pdf";

export default function AdminDocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const isMobile = useIsMobile();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setDocs(data || []);
    } catch (err: any) {
      toast.error("Failed to load documents: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const getFileBlob = async (filePath: string, mimeType: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("documents")
      .download(filePath);
    if (error || !data) return null;
    const blob = new Blob([data], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const openPreview = async (doc: any) => {
    setSelected(doc);
    setFileUrl(null);
    setFileLoading(true);
    const url = await getFileBlob(doc.file_path, doc.file_type);
    setFileUrl(url);
    setFileLoading(false);
  };

  const handleDownload = async (doc: any) => {
    const url = await getFileBlob(doc.file_path, doc.file_type);
    if (!url) { toast.error("Could not generate download link"); return; }
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = docs.filter((d) => {
    const matchesSearch = d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.invoice_number || "").toLowerCase().includes(search.toLowerCase());
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
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {docs.length === 0 ? "No documents found" : "No documents match your filters"}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <MobileRecordCard
              key={doc.id}
              title={doc.file_name}
              subtitle={doc.supplier_name || "—"}
              badge={{ label: doc.status, className: statusColors[doc.status] || "" }}
              fields={[
                { label: "Type", value: (doc.document_type || "—").replace("_", " ") },
                { label: "Date", value: new Date(doc.created_at).toLocaleDateString() },
                { label: "Confidence", value: doc.confidence_score ? `${Math.round(doc.confidence_score)}%` : "—" },
              ]}
              onClick={() => openPreview(doc)}
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">File</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Supplier</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Confidence</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isImageType(doc.file_type) ? (
                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm truncate max-w-[200px]">{doc.file_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.supplier_name || "—"}</td>
                      <td className="p-3 text-sm text-muted-foreground capitalize">{(doc.document_type || "—").replace("_", " ")}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`capitalize ${statusColors[doc.status] || ""}`}>
                          {doc.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {doc.confidence_score ? `${Math.round(doc.confidence_score)}%` : "—"}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openPreview(doc)} title="Preview">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(doc)} title="Download">
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>Document Details</span>
              {selected && (
                <Button variant="outline" size="sm" onClick={() => handleDownload(selected)}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* File preview */}
              <div className="rounded-lg border bg-muted/30 overflow-hidden">
                {fileLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : fileUrl ? (
                  isImageType(selected.file_type) ? (
                    <img src={fileUrl} alt={selected.file_name} className="max-h-[400px] w-full object-contain" />
                  ) : isPdfType(selected.file_type) ? (
                    <iframe src={fileUrl} className="w-full h-[400px]" title={selected.file_name} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileText className="h-10 w-10 mb-2 opacity-40" />
                      <p className="text-sm">Preview not available for this file type</p>
                      <Button variant="outline" size="sm" className="mt-3" onClick={() => handleDownload(selected)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Download to view
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                    Could not load file preview
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { l: "File Name", v: selected.file_name },
                  { l: "Supplier", v: selected.supplier_name || "—" },
                  { l: "Invoice #", v: selected.invoice_number || "—" },
                  { l: "Type", v: (selected.document_type || "—").replace("_", " ") },
                  { l: "Status", v: selected.status },
                  { l: "Total", v: selected.total_amount ? `€${selected.total_amount}` : "—" },
                  { l: "Confidence", v: selected.confidence_score ? `${Math.round(selected.confidence_score)}%` : "—" },
                  { l: "Source", v: selected.source },
                  { l: "Created", v: new Date(selected.created_at).toLocaleString() },
                ].map((f) => (
                  <div key={f.l}>
                    <p className="text-xs text-muted-foreground">{f.l}</p>
                    <p className="text-sm font-medium capitalize">{f.v}</p>
                  </div>
                ))}
              </div>
              {selected.confidence_score && selected.confidence_score < 0.7 && (
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