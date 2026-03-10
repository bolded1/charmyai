import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, RefreshCw } from "lucide-react";
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

export default function AdminAuditLogsPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const isMobile = useIsMobile();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setLogs((data as AuditLog[]) || []);
    } catch (err: any) {
      toast.error("Failed to load audit logs: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, []);

  const allActions = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((entry) => {
    const matchesSearch =
      (entry.details || "").toLowerCase().includes(search.toLowerCase()) ||
      (entry.user_email || "").toLowerCase().includes(search.toLowerCase()) ||
      (entry.action || "").toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    return matchesSearch && matchesAction;
  });

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
          {filtered.map((entry) => (
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.timestamp")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.user")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.action")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.entity")}</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">{t("admin.details")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((entry) => (
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
    </div>
  );
}
