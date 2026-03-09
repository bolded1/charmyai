import { useState, useCallback } from "react";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload as UploadIcon, FileText, CheckCircle2, Loader2, X, AlertCircle,
  Camera, FolderUp, Clock, Eye, ArrowRight, Mail, Copy, Check, Briefcase,
} from "lucide-react";
import { useUploadDocument, useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, startOfMonth } from "date-fns";
import { useOrganization, getImportEmailAddress } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { usePlatformLimits } from "@/hooks/usePlatformLimits";
import { useWorkspace } from "@/contexts/WorkspaceContext";

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
  const [scanPressed, setScanPressed] = useState(false);
  const [uploadPressed, setUploadPressed] = useState(false);
  const [copied, setCopied] = useState(false);
  const uploadMutation = useUploadDocument();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: documents = [] } = useDocuments();
  const { data: orgData } = useOrganization();
  const { data: limits } = usePlatformLimits();
  const { activeWorkspace, isAccountingFirm } = useWorkspace();
  const isClientContext = isAccountingFirm && activeWorkspace?.workspace_type === "client";
  const importEmailAddress = orgData ? getImportEmailAddress(orgData.import_email_token) : null;

  const maxFileSizeMB = limits?.maxFileSize ?? 20;
  const maxFilesPerUpload = limits?.maxFilesPerUpload ?? 10;
  const proDocsLimit = limits?.proDocsLimit ?? 999999;
  const docsThisMonth = documents.filter((d) => new Date(d.created_at) >= startOfMonth(new Date())).length;

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

      // Enforce file size limit
      const maxBytes = maxFileSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`File "${file.name}" exceeds the ${maxFileSizeMB}MB limit.`);
        return;
      }

      // Enforce monthly document limit
      if (docsThisMonth >= proDocsLimit) {
        toast.error(`Monthly document limit (${proDocsLimit}) reached. Contact your admin to increase it.`);
        return;
      }

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
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length > maxFilesPerUpload) {
      toast.error(`You can upload up to ${maxFilesPerUpload} files at a time.`);
      return;
    }
    dropped.forEach(processFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > maxFilesPerUpload) {
      toast.error(`You can upload up to ${maxFilesPerUpload} files at a time.`);
      e.target.value = "";
      return;
    }
    selected.forEach(processFile);
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
      {/* Onboarding Checklist */}
      <OnboardingChecklist />

      {/* Email Import Address */}
      {importEmailAddress && (
        <Card className="border-0 stat-card-violet">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl icon-bg-violet flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-violet" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold mb-0.5">Import Expenses via Email</h3>
                <p className="text-xs text-muted-foreground mb-2.5">
                  Forward invoices to this address and they'll be automatically processed.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-card/80 backdrop-blur-sm px-3 py-2 rounded-lg font-mono truncate border border-border/40">
                    {importEmailAddress}
                  </code>
                  <Button variant="outline" size="sm" className="shrink-0 h-8 gap-1.5 rounded-lg" onClick={copyEmail}>
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      <Card className="overflow-hidden border-0 lg:hidden">
        <CardContent className="p-0">
          <div
            className={`relative px-4 py-5 md:p-12 text-center transition-all cursor-pointer border-2 border-dashed rounded-2xl active:scale-[0.98] ${
              scanPressed
                ? "border-primary bg-primary/5 shadow-glow"
                : "border-border hover:border-primary/50 hover:bg-accent/30"
            }`}
            onClick={() => document.getElementById("camera-input")?.click()}
            onPointerDown={() => setScanPressed(true)}
            onPointerUp={() => setScanPressed(false)}
            onPointerLeave={() => setScanPressed(false)}
          >
            <div className={`mx-auto mb-2 md:mb-5 h-10 w-10 md:h-16 md:w-16 rounded-xl md:rounded-2xl flex items-center justify-center transition-all ${
              scanPressed ? "bg-gradient-sunset shadow-lg shadow-primary/25" : "icon-bg-violet"
            }`}>
              <Camera className={`h-5 w-5 md:h-7 md:w-7 transition-colors ${scanPressed ? "text-primary-foreground" : "text-violet"}`} style={{ color: scanPressed ? undefined : 'hsl(var(--violet))' }} />
            </div>
            <h2 className="text-sm md:text-xl font-bold text-foreground mb-0.5 md:mb-2">Scan Expense Document</h2>
            <p className="text-[11px] md:text-sm text-muted-foreground mb-2.5 md:mb-6 max-w-md mx-auto">Capture with your camera</p>
            <div className="flex items-center justify-center gap-1.5">
              <Badge variant="secondary" className="text-[9px] md:text-xs px-1.5 md:px-2.5 py-0 md:py-0.5 rounded-md md:rounded-lg">Photo</Badge>
              <Badge variant="secondary" className="text-[9px] md:text-xs px-1.5 md:px-2.5 py-0 md:py-0.5 rounded-md md:rounded-lg">Auto-process</Badge>
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
      <Card className="overflow-hidden border-0">
        <CardContent className="p-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative px-4 py-5 md:px-6 md:py-6 text-center transition-all cursor-pointer border-2 border-dashed rounded-2xl active:scale-[0.98] ${
              dragOver || uploadPressed
                ? "border-primary bg-primary/5 scale-[1.01] shadow-glow"
                : "border-border hover:border-primary/50 hover:bg-accent/30"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
            onPointerDown={() => setUploadPressed(true)}
            onPointerUp={() => setUploadPressed(false)}
            onPointerLeave={() => setUploadPressed(false)}
          >
            <div className={`mx-auto mb-2 h-10 w-10 md:h-11 md:w-11 rounded-xl flex items-center justify-center transition-all ${
              dragOver || uploadPressed ? "bg-hero-gradient shadow-lg shadow-primary/25" : "icon-bg-violet"
            }`}>
              <UploadIcon className={`h-4.5 w-4.5 md:h-5 md:w-5 transition-colors ${dragOver || uploadPressed ? "text-primary-foreground" : "text-violet"}`} style={{ color: dragOver || uploadPressed ? undefined : 'hsl(var(--violet))' }} />
            </div>
            <h2 className="text-sm md:text-base font-bold text-foreground mb-0.5">
              {dragOver ? "Drop files to upload" : "Upload Expense Documents"}
            </h2>
            <p className="text-[11px] text-muted-foreground mb-2.5 max-w-sm mx-auto">
              Drag and drop your invoices, receipts, or bills here.
            </p>
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">PDF</Badge>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">PNG</Badge>
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 rounded-md">JPG</Badge>
              <span className="text-[9px] text-muted-foreground">Up to 20MB</span>
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



      {files.length > 0 && (
        <Card className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate("/app/documents")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Loader2 className={`h-4 w-4 ${files.some((f) => f.status === "uploading" || f.status === "processing") ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              Uploading
              <Badge variant="secondary" className="text-[10px] ml-1">{files.length}</Badge>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto" />
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

    </div>
  );
}
