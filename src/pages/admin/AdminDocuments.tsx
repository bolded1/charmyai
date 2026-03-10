import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const statusColors: Record<string, string> = {
  processing: "bg-muted text-muted-foreground",
  processed: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  failed: "bg-destructive/10 text-destructive",
};

const isImageType = (type: string) => type?.startsWith("image/");

export default function AdminDocumentsPage() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const isMobile = useIsMobile();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, file_type, supplier_name, invoice_number, document_type, status, confidence_score, source, created_at, total_amount, currency")
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
          <Input placeholder={t("admin.searchDocuments")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder={t("admin.allStatus")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.allStatus")}</SelectItem>
            <SelectItem value="processing">{t("common.processing")}</SelectItem>
            <SelectItem value="processed">{t("common.processed")}</SelectItem>
            <SelectItem value="approved">{t("documents.approved")}</SelectItem>
            <SelectItem value="failed">{t("admin.failed")}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchDocs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> {t("admin.refresh")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {docs.length === 0 ? t("admin.noDocumentsFound") : t("admin.noDocumentsMatch")}
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
                { label: t("admin.type"), value: (doc.document_type || "—").replace("_", " ") },
                { label: t("admin.date"), value: new Date(doc.created_at).toLocaleDateString() },
                { label: t("admin.total"), value: doc.total_amount ? `${doc.currency || "€"}${doc.total_amount}` : "—" },
                { label: t("admin.confidence"), value: doc.confidence_score ? `${Math.round(doc.confidence_score)}%` : "—" },
              ]}
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.file")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.supplier")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.type")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.status")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.total")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.confidence")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.date")}</th>
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
                        {doc.total_amount ? `${doc.currency || "€"}${doc.total_amount}` : "—"}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {doc.confidence_score ? `${Math.round(doc.confidence_score)}%` : "—"}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
