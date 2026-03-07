import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload as UploadIcon, FileText, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";

interface UploadFile {
  id: string;
  name: string;
  size: string;
  status: 'uploading' | 'processing' | 'done';
  progress: number;
}

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const simulateUpload = useCallback((fileName: string) => {
    const id = Math.random().toString(36).slice(2);
    const file: UploadFile = { id, name: fileName, size: '2.4 MB', status: 'uploading', progress: 0 };
    setFiles((prev) => [...prev, file]);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress >= 100) {
        clearInterval(interval);
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'processing', progress: 100 } : f));
        setTimeout(() => {
          setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: 'done' } : f));
          toast.success(`${fileName} processed successfully`);
        }, 2000);
      } else {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, progress } : f));
      }
    }, 300);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    droppedFiles.forEach((f) => simulateUpload(f.name));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    selected.forEach((f) => simulateUpload(f.name));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Drop zone */}
      <Card>
        <CardContent className="p-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-16 text-center transition-colors cursor-pointer ${
              dragOver ? 'border-primary bg-accent' : 'border-border'
            }`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-1">Drop documents here</h3>
            <p className="text-sm text-muted-foreground mb-4">or click to browse files</p>
            <p className="text-xs text-muted-foreground">Supports PDF, PNG, JPG up to 20MB</p>
            <input id="file-input" type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} />
          </div>
        </CardContent>
      </Card>

      {/* Upload list */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center shrink-0">
                  {file.status === 'done' ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : file.status === 'processing' ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {file.status === 'uploading' && `Uploading... ${file.progress}%`}
                    {file.status === 'processing' && 'AI is extracting data...'}
                    {file.status === 'done' && 'Processed — ready for review'}
                  </p>
                  {file.status === 'uploading' && (
                    <div className="h-1 bg-border rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${file.progress}%` }} />
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeFile(file.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Quick demo */}
      <div className="text-center">
        <Button variant="outline" size="sm" onClick={() => simulateUpload("demo-invoice-2024.pdf")}>
          Try with Demo Document
        </Button>
      </div>
    </div>
  );
}
