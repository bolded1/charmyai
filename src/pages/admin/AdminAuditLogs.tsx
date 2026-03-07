import { useState } from "react";
import { adminAuditLogs } from "@/lib/admin-mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const actionColors: Record<string, string> = {
  document_uploaded: "bg-accent text-accent-foreground",
  document_processed: "bg-primary/10 text-primary",
  document_approved: "bg-primary/10 text-primary",
  document_failed: "bg-destructive/10 text-destructive",
  document_edited: "bg-secondary text-secondary-foreground",
  export_generated: "bg-secondary text-secondary-foreground",
  user_invited: "bg-accent text-accent-foreground",
  user_registered: "bg-accent text-accent-foreground",
  organization_created: "bg-primary/10 text-primary",
  subscription_suspended: "bg-destructive/10 text-destructive",
};

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const allActions = [...new Set(adminAuditLogs.map((l) => l.action))];

  const filtered = adminAuditLogs.filter((entry) => {
    const matchesSearch = entry.details.toLowerCase().includes(search.toLowerCase()) || entry.user.toLowerCase().includes(search.toLowerCase()) || entry.organization.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === "all" || entry.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search logs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Actions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {allActions.map((a) => (
              <SelectItem key={a} value={a} className="capitalize">{a.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">Timestamp</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">User</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Organization</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Action</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Entity</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-sm text-muted-foreground whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-sm">{entry.user}</td>
                    <td className="p-3 text-sm text-muted-foreground">{entry.organization}</td>
                    <td className="p-3">
                      <Badge variant="secondary" className={`text-[10px] capitalize ${actionColors[entry.action] || ''}`}>
                        {entry.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">{entry.entity}</td>
                    <td className="p-3 text-sm">{entry.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
