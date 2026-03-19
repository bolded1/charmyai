import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, RefreshCw, Download, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const actionColors: Record<string, string> = {
  document_uploaded: "bg-accent text-accent-foreground",
  document_processed: "bg-primary/10 text-primary",
  document_approved: "bg-primary/10 text-primary",
  document_failed: "bg-destructive/10 text-destructive",
  document_edited: "bg-secondary text-secondary-foreground",
  export_generated: "bg-secondary text-secondary-foreground",
  user_login: "bg-accent text-accent-foreground",
  user_signup: "bg-accent text-accent-foreground",
  settings_updated: "bg-secondary text-secondary-foreground",
  admin_gdpr_delete: "bg-destructive/10 text-destructive",
  admin_gdpr_export: "bg-accent text-accent-foreground",
  admin_firm_action: "bg-accent text-accent-foreground",
  admin_bulk_deactivate: "bg-destructive/10 text-destructive",
  admin_bulk_role_change: "bg-accent text-accent-foreground",
  admin_flag_created: "bg-primary/10 text-primary",
  admin_flag_deleted: "bg-destructive/10 text-destructive",
  admin_flag_toggled: "bg-accent text-accent-foreground",
};

interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: string | null;
  metadata: any;
  created_at: string;
}

type SortField = "created_at" | "user_email" | "action" | null;

export default function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(50);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const isMobile = useIsMobile();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (err: any) {
      toast.error("Failed to load audit logs: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => { setVisibleCount(50); }, [search, actionFilter]);

  const allActions = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((entry) => {
    const matchesSearch =
      (entry.details || "").toLowerCase().includes(search.toLowerCase()) ||
      (entry.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (entry.action || "").toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
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
      if (sortField === "created_at") cmp = (a.created_at || "").localeCompare(b.created_at || "");
      else if (sortField === "user_email") cmp = (a.user_email || "").localeCompare(b.user_email || "");
      else if (sortField === "action") cmp = (a.action || "").localeCompare(b.action || "");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const paginated = sorted.slice(0, visibleCount);

  const handleExportCsv = () => {
    const rows = [["Timestamp", "User Email", "Action", "Entity Type", "Entity ID", "Details"]];
    filtered.forEach((e) => {
      rows.push([
        new Date(e.created_at).toISOString(),
        e.user_email || "",
        e.action,
        e.entity_type || "",
        e.entity_id || "",
        e.details || "",
      ]);
    });
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("admin.searchLogs")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder={t("admin.allActions")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin.allActions")}</SelectItem>
            {allActions.map((a) => (
              <SelectItem key={a} value={a} className="capitalize">{a.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
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
            {logs.length === 0 ? t("admin.noAuditLogs") : t("admin.noLogsMatch")}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {paginated.map((entry) => (
            <MobileRecordCard
              key={entry.id}
              title={entry.details || entry.action.replace(/_/g, " ")}
              subtitle={entry.user_email || t("admin.system")}
              badge={{
                label: entry.action.replace(/_/g, " "),
                className: actionColors[entry.action] || "bg-secondary text-secondary-foreground",
              }}
              fields={[
                { label: t("admin.entity"), value: entry.entity_type || "—" },
                { label: t("admin.timestamp"), value: new Date(entry.created_at).toLocaleString() },
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
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("created_at")} aria-sort={sortField === "created_at" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.timestamp")}<SortIcon field="created_at" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("user_email")} aria-sort={sortField === "user_email" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.user")}<SortIcon field="user_email" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground" onClick={() => toggleSort("action")} aria-sort={sortField === "action" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">{t("admin.action")}<SortIcon field="action" /></span>
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.entity")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.details")}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                      <td className="p-3 text-sm">{entry.user_email || t("admin.system")}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`text-[10px] capitalize ${actionColors[entry.action] || "bg-secondary text-secondary-foreground"}`}>
                          {entry.action.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{entry.entity_type || "—"}</td>
                      <td className="p-3 text-sm">{entry.details || "—"}</td>
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
