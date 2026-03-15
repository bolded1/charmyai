import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileText, CheckCircle2, Loader2, X, AlertCircle, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const UPLOAD_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/document-request-upload`;

interface RequestInfo {
  title: string;
  description: string | null;
  status: "active" | "closed" | "expired";
  expires_at: string | null;
  upload_count: number;
  firm_name: string;
  workspace_name: string;
}

interface UploadEntry {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentRequestUpload() {
  const { token } = useParams<{ token: string }>();

  const [requestInfo, setRequestInfo] = useState<RequestInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [uploaderName, setUploaderName] = useState("");
  const [uploaderEmail, setUploaderEmail] = useState("");
  const [files, setFiles] = useState<UploadEntry[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch request info on mount
  useEffect(() => {
    if (!token) {
      setInfoError("Invalid upload link.");
      setLoadingInfo(false);
      return;
    }
    fetch(`${UPLOAD_URL}?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setRequestInfo(data.request);
      })
      .catch((e) => setInfoError(e.message ?? "Could not load upload link."))
      .finally(() => setLoadingInfo(false));
  }, [token]);

  const uploadFile = useCallback(
    async (file: File) => {
      const id = Math.random().toString(36).slice(2);
      const entry: UploadEntry = {
        id,
        name: file.name,
        size: formatBytes(file.size),
        status: "uploading",
        progress: 30,
      };
      setFiles((prev) => [entry, ...prev]);

      const formData = new FormData();
      formData.append("token", token!);
      formData.append("file", file);
      if (uploaderName.trim()) formData.append("uploader_name", uploaderName.trim());
      if (uploaderEmail.trim()) formData.append("uploader_email", uploaderEmail.trim());

      try {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, progress: 60 } : f));
        const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "done", progress: 100 } : f));
        // Refresh upload count
        setRequestInfo((prev) => prev ? { ...prev, upload_count: prev.upload_count + 1 } : prev);
      } catch (e: any) {
        setFiles((prev) =>
          prev.map((f) => f.id === id ? { ...f, status: "error", progress: 100, error: e.message } : f)
        );
      }
    },
    [token, uploaderName, uploaderEmail]
  );

  const handleFiles = useCallback(
    (selected: File[]) => {
      if (isUploading) return;
      selected.forEach(uploadFile);
    },
    [uploadFile, isUploading]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(e.target.files ?? []));
    e.target.value = "";
  };

  const allDone = files.length > 0 && files.every((f) => f.status === "done");
  const anyUploading = files.some((f) => f.status === "uploading");

  // ── Loading ────────────────────────────────────────────────────────────
  if (loadingInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────
  if (infoError || !requestInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold">Link not found</h1>
          <p className="text-sm text-muted-foreground">{infoError ?? "This upload link is invalid."}</p>
        </div>
      </div>
    );
  }

  // ── Closed / Expired ───────────────────────────────────────────────────
  if (requestInfo.status !== "active") {
    const isExpired = requestInfo.status === "expired";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">{isExpired ? "Link expired" : "Request closed"}</h1>
          <p className="text-sm text-muted-foreground">
            {isExpired
              ? "This upload link has expired. Please contact your accountant for a new link."
              : "This upload request has been closed by your accountant. No more uploads are accepted."}
          </p>
          <p className="text-xs text-muted-foreground">Sent by {requestInfo.firm_name}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-start pt-12 pb-16 px-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{requestInfo.title}</h1>
          {requestInfo.description && (
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">{requestInfo.description}</p>
          )}
          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>
              {requestInfo.firm_name}
              {requestInfo.workspace_name && ` · ${requestInfo.workspace_name}`}
            </span>
          </div>
          {requestInfo.expires_at && (
            <p className="text-xs text-amber-600">
              Deadline: {format(new Date(requestInfo.expires_at), "PPP")}
            </p>
          )}
        </div>

        {/* Optional sender info */}
        <div className="bg-background rounded-xl border border-border p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your details (optional)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="uploader-name" className="text-xs">Name</Label>
              <Input
                id="uploader-name"
                placeholder="Jane Smith"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
                disabled={anyUploading}
                className="text-sm h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="uploader-email" className="text-xs">Email</Label>
              <Input
                id="uploader-email"
                type="email"
                placeholder="jane@example.com"
                value={uploaderEmail}
                onChange={(e) => setUploaderEmail(e.target.value)}
                disabled={anyUploading}
                className="text-sm h-9"
              />
            </div>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-10 flex flex-col items-center gap-3 text-center transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border bg-background hover:border-primary/50 hover:bg-muted/40"
          )}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={handleSelect}
            disabled={anyUploading}
          />
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-0.5">PDF, PNG, JPG, WebP · max 20 MB each</p>
          </div>
          <Button size="sm" variant="outline" type="button" disabled={anyUploading}>
            Select files
          </Button>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5"
              >
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{f.size}</span>
                    {f.status === "uploading" && (
                      <Progress value={f.progress} className="h-1 flex-1 max-w-[100px]" />
                    )}
                    {f.status === "error" && (
                      <span className="text-xs text-destructive">{f.error}</span>
                    )}
                  </div>
                </div>
                {f.status === "uploading" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
                {f.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                {f.status === "error" && <X className="h-4 w-4 text-destructive shrink-0" />}
              </div>
            ))}
          </div>
        )}

        {/* All done banner */}
        {allDone && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              All files uploaded successfully! Your accountant will review them shortly.
            </p>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Powered by <span className="font-medium">Charmy</span>
        </p>
      </div>
    </div>
  );
}
