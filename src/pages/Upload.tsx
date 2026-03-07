import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react";
import { useUploadDocument } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const uploadMutation = useUploadDocument();
  const { user } = useAuth();
  const navigate = useNavigate();

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!user) {
        navigate("/login");
        return;
      }

      const id = Math.random().toString(36).slice(2);
      const entry: UploadingFile = {
        id,
        name: file.name,
        size: formatSize(file.size),
        status: "uploading",
      };
      setFiles((prev) => [...prev, entry]);

      try {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "processing" } : f)));
        await uploadMutation.mutateAsync(file);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "done" } : f)));
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "error", error: err.message } : f
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {!user && (
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please{" "}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate("/login")}>
                log in
              </Button>{" "}
              to upload documents.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-accent" : "border-border"
            }`}
            onClick={() => document.getElementById("file-input")?.click()}
          >
            <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">Drop documents here</h3>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <p className="text-xs text-muted-foreground">
              Supports PDF, PNG, JPG up to 20MB
            </p>
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
        <Card>
          <CardContent className="p-4 space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center shrink-0">
                  {file.status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : file.status === "error" ? (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  ) : file.status === "processing" ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.status === "uploading" && "Uploading..."}
                    {file.status === "processing" && "AI is extracting data..."}
                    {file.status === "done" && "Processed — ready for review"}
                    {file.status === "error" && (file.error || "Upload failed")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {files.some((f) => f.status === "done") && (
        <div className="text-center">
          <Button variant="outline" size="sm" onClick={() => navigate("/app/documents")}>
            View Documents
          </Button>
        </div>
      )}
    </div>
  );
}
