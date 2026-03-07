import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Search, TrendingUp, Loader2, Upload, FileText, CheckCircle2, X, AlertCircle,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useIncomeRecords, useUploadIncomeDocument } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
}

export default function IncomePage() {
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const { user } = useAuth();
  const { data: income = [], isLoading } = useIncomeRecords();
  const uploadMutation = useUploadIncomeDocument();

  const filtered = income.filter((d) =>
    (d.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (d.invoice_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!user) return;
      const id = Math.random().toString(36).slice(2);
      const entry: UploadingFile = {
        id, name: file.name, size: formatSize(file.size), status: "uploading", progress: 20,
      };
      setFiles((prev) => [entry, ...prev]);

      try {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 40 } : f)));
        await new Promise((r) => setTimeout(r, 200));
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "processing", progress: 60 } : f)));
        await uploadMutation.mutateAsync(file);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "done", progress: 100 } : f)));
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) => f.id === id ? { ...f, status: "error", progress: 100, error: err.message } : f)
        );
      }
    },
    [user, uploadMutation]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    Array.from(e.dataTransfer.files).forEach(processFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(processFile);
    e.target.value = "";
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view income.</div>;
  }

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Total income</p>
          <p className="text-2xl font-bold">€{total.toFixed(2)}</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Upload Box */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative p-8 text-center transition-all cursor-pointer border-2 border-dashed rounded-lg ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            }`}
            onClick={() => document.getElementById("income-file-input")?.click()}
          >
            <div className={`mx-auto mb-3 h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
              dragOver ? "bg-primary/10" : "bg-muted"
            }`}>
              <Upload className={`h-5 w-5 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {dragOver ? "Drop to upload" : "Upload Sales Invoices"}
            </h3>
            <p className="text-sm text-muted-foreground mb-3 max-w-sm mx-auto">
              Upload your company's invoices here. AI will extract the data and add it to your income records automatically.
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs px-2.5 py-0.5">PDF</Badge>
              <Badge variant="secondary" className="text-xs px-2.5 py-0.5">PNG</Badge>
              <Badge variant="secondary" className="text-xs px-2.5 py-0.5">JPG</Badge>
            </div>
            <input
              id="income-file-input"
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Active Uploads */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center shrink-0">
                  {file.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : file.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{file.size}</span>
                  </div>
                  <Progress value={file.progress} className="h-1" />
                  <p className="text-[11px] text-muted-foreground">
                    {file.status === "uploading" && "Uploading..."}
                    {file.status === "processing" && "AI extracting income data..."}
                    {file.status === "done" && "Added to income"}
                    {file.status === "error" && (file.error || "Upload failed")}
                  </p>
                </div>
                <button className="h-6 w-6 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Income Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No income records yet. Upload your sales invoices above to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Due Date</th>
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
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.customer_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.invoice_number || "—"}</td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.invoice_date}</td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.due_date || "—"}</td>
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