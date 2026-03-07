import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, AlertCircle, Upload as UploadIcon, Loader2, CheckCircle2, X, AlertCircle as AlertCircleIcon } from "lucide-react";
import { useDocuments, useExpenseRecords, useUploadDocument } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  processing: "bg-muted text-muted-foreground",
  needs_review: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  exported: "bg-secondary text-secondary-foreground",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: documents = [], isLoading: docsLoading } = useDocuments();
  const { data: expenses = [], isLoading: expLoading } = useExpenseRecords();
  const uploadMutation = useUploadDocument();
  const navigate = useNavigate();
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!user) { navigate("/login"); return; }
    Array.from(e.dataTransfer.files).forEach((file) => uploadMutation.mutate(file));
  }, [user, uploadMutation, navigate]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) { navigate("/login"); return; }
    Array.from(e.target.files || []).forEach((file) => uploadMutation.mutate(file));
    e.target.value = "";
  }, [user, uploadMutation, navigate]);

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to view dashboard.</div>;
  }

  const isLoading = docsLoading || expLoading;
  const awaitingReview = documents.filter((d) => d.status === "needs_review").length;

  const expensesByCurrency: Record<string, number> = {};
  expenses.forEach((e) => {
    const cur = e.currency || "EUR";
    expensesByCurrency[cur] = (expensesByCurrency[cur] || 0) + Number(e.total_amount || 0);
  });

  const stats = [
    { label: "Documents Uploaded", value: documents.length, icon: FileText, sub: `${documents.filter(d => d.status === 'approved').length} approved` },
    ...Object.entries(expensesByCurrency).map(([cur, total]) => ({
      label: `Expenses (${cur})`,
      value: `${cur === "EUR" ? "€" : "$"}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: Receipt,
      sub: `${expenses.filter(e => e.currency === cur).length} records`,
    })),
    { label: "Awaiting Review", value: awaitingReview, icon: AlertCircle, sub: awaitingReview > 0 ? "Action needed" : "All clear" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const recentDocs = documents.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Area */}
      <Card>
        <CardContent className="p-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
              dragOver ? "border-primary bg-accent" : "border-border"
            }`}
            onClick={() => document.getElementById("dashboard-file-input")?.click()}
          >
            <UploadIcon className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Drop documents here</h3>
            <p className="text-sm text-muted-foreground mb-2">or click to browse files</p>
            <p className="text-xs text-muted-foreground">Supports PDF, PNG, JPG up to 20MB</p>
            <input
              id="dashboard-file-input"
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {recentDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No documents yet. Upload your first invoice to get started.</p>
          ) : (
            <div className="space-y-3">
              {recentDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">{doc.supplier_name || "Processing..."}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {Number(doc.total_amount) > 0 && (
                      <span className="text-sm font-medium">{doc.currency} {Number(doc.total_amount).toFixed(2)}</span>
                    )}
                    <Badge variant="secondary" className={statusColors[doc.status] || ""}>
                      {doc.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
