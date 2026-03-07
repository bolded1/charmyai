import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload as UploadIcon, FileText, CheckCircle2, Loader2, X, AlertCircle,
  Camera, FolderUp, Clock, Eye, ArrowRight, Mail, Copy, Check,
} from "lucide-react";
import { useUploadDocument, useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { useOrganization, getImportEmailAddress } from "@/hooks/useOrganization";
import { toast } from "sonner";

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  const uploadMutation = useUploadDocument();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: documents = [] } = useDocuments();
  const { data: orgData } = useOrganization();
  const importEmailAddress = orgData ? getImportEmailAddress(orgData.import_email_token) : null;

  const copyEmail = () => {
    if (importEmailAddress) {
      navigator.clipboard.writeText(importEmailAddress);
      setCopied(true);
      toast.success("Email address copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const processing = documents.filter((d) => d.status === "processing");
  const needsReview = documents.filter((d) => d.status === "processed" || d.status === "needs_review");
  const recent = documents.slice(0, 8);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!user) { navigate("/login"); return; }

      const id = Math.random().toString(36).slice(2);
      const entry: UploadingFile = {
        id,
        name: file.name,
        size: formatSize(file.size),
        status: "uploading",
        progress: 20,
      };
      setFiles((prev) => [entry, ...prev]);

      try {
        // Simulate upload progress
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 50 } : f)));
        await new Promise((r) => setTimeout(r, 200));
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "processing", progress: 75 } : f)));
        await uploadMutation.mutateAsync(file);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "done", progress: 100 } : f)));
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "error", progress: 100, error: err.message } : f
          )
        );
      }
    },
    [user, uploadMutation, navigate]
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

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "processing": return "bg-amber-500/15 text-amber-600 border-amber-500/20";
      case "processed":
      case "needs_review": return "bg-blue-500/15 text-blue-600 border-blue-500/20";
      case "approved": return "bg-emerald-500/15 text-emerald-600 border-emerald-500/20";
      case "exported": return "bg-purple-500/15 text-purple-600 border-purple-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "processing": return "Processing";
      case "processed":
      case "needs_review": return "Needs Review";
      case "approved": return "Approved";
      case "exported": return "Exported";
      default: return status;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Scan Document - shown first and large on mobile/tablet */}
      <Card className="overflow-hidden lg:hidden">
        <CardContent className="p-0">
          <div
            className="relative p-16 text-center transition-all cursor-pointer border-2 border-dashed rounded-lg border-border hover:border-primary/50 hover:bg-accent/50"
            onClick={() => document.getElementById("camera-input")?.click()}
          >
            <div className="mx-auto mb-5 h-16 w-16 rounded-2xl flex items-center justify-center bg-muted">
              <Camera className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Scan Document</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Use your camera to capture invoices, receipts, or bills. They'll be automatically processed.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-xs px-3 py-1">Photo</Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">Auto-process</Badge>
            </div>
            <input
              id="camera-input"
              type="file"
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative p-16 text-center transition-all cursor-pointer border-2 border-dashed rounded-lg ${
              dragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-accent/50"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <div className={`mx-auto mb-5 h-16 w-16 rounded-2xl flex items-center justify-center transition-colors ${
              dragOver ? "bg-primary/10" : "bg-muted"
            }`}>
              <UploadIcon className={`h-7 w-7 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {dragOver ? "Drop files to upload" : "Upload Documents"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Drag and drop your invoices, receipts, or bills here. They'll be automatically processed and ready for review.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Badge variant="secondary" className="text-xs px-3 py-1">PDF</Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">PNG</Badge>
              <Badge variant="secondary" className="text-xs px-3 py-1">JPG</Badge>
              <span className="text-xs text-muted-foreground">Up to 20MB each</span>
            </div>
            <input
              id="file-input"
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
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Loader2 className={`h-4 w-4 ${files.some((f) => f.status === "uploading" || f.status === "processing") ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              Uploading
              <Badge variant="secondary" className="text-[10px] ml-1">{files.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center shrink-0">
                  {file.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : file.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{file.size}</span>
                  </div>
                  <Progress value={file.progress} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground">
                    {file.status === "uploading" && "Uploading..."}
                    {file.status === "processing" && "AI is extracting data..."}
                    {file.status === "done" && "Ready for review"}
                    {file.status === "error" && (file.error || "Upload failed")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Processing Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Processing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Processing
              </span>
              {processing.length > 0 && (
                <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">
                  {processing.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {processing.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No documents processing</p>
            ) : (
              <div className="space-y-2">
                {processing.slice(0, 5).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/50">
                    <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin shrink-0" />
                    <p className="text-sm truncate flex-1">{doc.file_name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Needs Review */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                Needs Review
              </span>
              {needsReview.length > 0 && (
                <Badge className="bg-blue-500/15 text-blue-600 border-blue-500/20 text-[10px]">
                  {needsReview.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {needsReview.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">All documents reviewed</p>
            ) : (
              <div className="space-y-2">
                {needsReview.slice(0, 5).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-2.5 rounded-md bg-muted/50 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => navigate("/app/documents")}
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                    <p className="text-sm truncate flex-1">{doc.file_name}</p>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>
                ))}
                {needsReview.length > 5 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate("/app/documents")}>
                    View all {needsReview.length} documents
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads */}
      {recent.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              Recent Uploads
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => navigate("/app/documents")}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {recent.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 p-2.5 rounded-md hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => navigate("/app/documents")}
                >
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      {doc.total_amount ? ` · ${doc.currency || "EUR"} ${Number(doc.total_amount).toFixed(2)}` : ""}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-[10px] shrink-0 ${statusColor(doc.status)}`}>
                    {statusLabel(doc.status)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
