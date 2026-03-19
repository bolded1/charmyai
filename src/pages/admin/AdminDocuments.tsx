import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Loader2, RefreshCw, Image as ImageIcon, Download, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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

type SortField = "file_name" | "supplier_name" | "status" | "total_amount" | "created_at" | null;

export default function AdminDocumentsPage() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [retrying, setRetrying] = useState<string | null>(null);
  const isMobile = useIsMobile();

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("id, file_name, file_type, supplier_name, invoice_number, document_type, status, confidence_score, source, created_at, total_amount, currency")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setDocs(data || []);
    } catch (err: any) {
      toast.error("Failed to load documents: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);
  useEffect(() => { setVisibleCount(50); }, [search, statusFilter]);

  const filtered = docs.filter((d) => {
    const matchesSearch = d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.invoice_number || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "total_amount" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "file_name") cmp = (a.file_name || "").localeCompare(b.file_name || "");
      else if (sortField === "supplier_name") cmp = (a.supplier_name || "").localeCompare(b.supplier_name || "");
      else if (sortField === "status") cmp = (a.status || "").localeCompare(b.status || "");
      else if (sortField === "total_amount") cmp = (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
      else if (sortField === "created_at") cmp = (a.created_at || "").localeCompare(b.created_at || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const paginated = sorted.slice(0, visibleCount);

  const handleRetry = async (docId: string) => {
    setRetrying(docId);
    try {
      await supabase.from("documents").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", docId);
      await supabase.functions.invoke("extract-document", { body: { documentId: docId } });
      toast.success("Document queued for reprocessing");
      fetchDocs();
    } catch (err: any) {
      toast.error("Retry failed: " + (err.message || "Unknown error"));
    } finally {
      setRetrying(null);
    }
  };

  const handleExportCsv = () => {
    const rows = [["File Name", "Supplier", "Type", "Status", "Total", "Currency", "Confidence", "Date"]];
    filtered.forEach((d) => {
      rows.push([
        d.file_name,
        d.supplier_name || "",
        (d.document_type || "").replace("_", " "),
        d.status,
        String(d.total_amount || ""),
        d.currency || "",
        d.confidence_score ? `${Math.round(d.confidence_score)}%` : "",
        new Date(d.created_at).toLocaleDateString(),
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-documents-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
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
          {paginated.map((doc) => (
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
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("file_name")} aria-sort={sortField === "file_name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.file")}<SortIcon field="file_name" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("supplier_name")} aria-sort={sortField === "supplier_name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.supplier")}<SortIcon field="supplier_name" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.type")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("status")} aria-sort={sortField === "status" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.status")}<SortIcon field="status" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("total_amount")} aria-sort={sortField === "total_amount" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.total")}<SortIcon field="total_amount" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.confidence")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("created_at")} aria-sort={sortField === "created_at" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.date")}<SortIcon field="created_at" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isImageType(doc.file_type) ? (
                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm truncate max-w-[200px]" title={doc.file_name}>{doc.file_name}</span>
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
                      <td className="p-3">
                        {doc.status === "failed" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRetry(doc.id)} disabled={retrying === doc.id} title="Retry processing">
                            {retrying === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {filtered.length > visibleCount && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + 50)}>
            Show more ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
