import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace, Workspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2, Briefcase, Plus, Trash2, Pencil, FileText, Receipt,
  ArrowRight, Loader2, AlertTriangle, Clock, Download, Eye,
  TrendingUp, CheckCircle2, Search, LayoutGrid, List, Archive,
  Activity, BarChart3, Users,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

/* ── Stat card helper ── */
function StatCard({ icon: Icon, label, value, accent, subtext }: {
  icon: React.ElementType; label: string; value: string | number; accent: string; subtext?: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            {subtext && <p className="text-[11px] text-muted-foreground">{subtext}</p>}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Activity item ── */
function ActivityItem({ icon: Icon, text, time, accent }: {
  icon: React.ElementType; text: string; time: string; accent: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${accent}`}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-foreground leading-snug">{text}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{time}</p>
      </div>
    </div>
  );
}

export default function WorkspacesPage() {
  const {
    activeWorkspace, allWorkspaces, isAccountingFirm, clientWorkspaces,
    switchWorkspace, createClientWorkspace, deleteClientWorkspace, updateClientWorkspace,
  } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const homeOrg = allWorkspaces.find(
    (w) => w.workspace_type === "accounting_firm" || w.workspace_type === "standard"
  );
  const maxWorkspaces = homeOrg?.max_client_workspaces || 10;

  // Fetch cross-workspace stats for all client workspaces
  const clientOrgIds = useMemo(() => clientWorkspaces.map((w) => w.id), [clientWorkspaces]);

  const { data: allDocs = [] } = useQuery({
    queryKey: ["firm-all-docs", clientOrgIds],
    queryFn: async () => {
      if (clientOrgIds.length === 0) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("id, organization_id, status, file_name, created_at, supplier_name")
        .in("organization_id", clientOrgIds)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: isAccountingFirm && clientOrgIds.length > 0,
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ["firm-all-expenses", clientOrgIds],
    queryFn: async () => {
      if (clientOrgIds.length === 0) return [];
      const { data, error } = await supabase
        .from("expense_records")
        .select("id, organization_id, created_at, supplier_name, total_amount")
        .in("organization_id", clientOrgIds)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: isAccountingFirm && clientOrgIds.length > 0,
  });

  const { data: allExports = [] } = useQuery({
    queryKey: ["firm-all-exports", clientOrgIds],
    queryFn: async () => {
      if (clientOrgIds.length === 0) return [];
      const { data, error } = await supabase
        .from("export_history")
        .select("id, organization_id, created_at, export_name, format")
        .in("organization_id", clientOrgIds)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: isAccountingFirm && clientOrgIds.length > 0,
  });

  // Derived stats
  const totalDocs = allDocs.length;
  const needsReview = allDocs.filter((d) => d.status === "processed").length;
  const totalExports = allExports.length;
  const activeWsCount = clientWorkspaces.length;

  // Per-workspace stats
  const wsStats = useMemo(() => {
    const map: Record<string, { docs: number; review: number; lastActivity: string | null }> = {};
    for (const ws of clientWorkspaces) {
      map[ws.id] = { docs: 0, review: 0, lastActivity: null };
    }
    for (const doc of allDocs) {
      if (doc.organization_id && map[doc.organization_id]) {
        map[doc.organization_id].docs++;
        if (doc.status === "processed") map[doc.organization_id].review++;
        if (!map[doc.organization_id].lastActivity || doc.created_at > map[doc.organization_id].lastActivity!) {
          map[doc.organization_id].lastActivity = doc.created_at;
        }
      }
    }
    return map;
  }, [clientWorkspaces, allDocs]);

  // Recent activity feed (last 10 across all workspaces)
  const recentActivity = useMemo(() => {
    const items: { type: string; text: string; time: string; ws: string }[] = [];
    const wsMap = Object.fromEntries(clientWorkspaces.map((w) => [w.id, w.name]));

    for (const doc of allDocs.slice(0, 20)) {
      const wsName = doc.organization_id ? wsMap[doc.organization_id] || "Unknown" : "Unknown";
      if (doc.status === "processing") {
        items.push({ type: "upload", text: `"${doc.file_name}" uploaded in ${wsName}`, time: doc.created_at, ws: wsName });
      } else if (doc.status === "processed") {
        items.push({ type: "processed", text: `"${doc.file_name}" processed in ${wsName}`, time: doc.created_at, ws: wsName });
      } else if (doc.status === "approved") {
        items.push({ type: "approved", text: `"${doc.file_name}" approved in ${wsName}`, time: doc.created_at, ws: wsName });
      }
    }
    for (const exp of allExports.slice(0, 5)) {
      const wsName = exp.organization_id ? wsMap[exp.organization_id] || "Unknown" : "Unknown";
      items.push({ type: "export", text: `Export "${exp.export_name}" (${exp.format}) from ${wsName}`, time: exp.created_at, ws: wsName });
    }

    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);
  }, [allDocs, allExports, clientWorkspaces]);

  // Filtered workspaces
  const filteredWorkspaces = clientWorkspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const ws = await createClientWorkspace(newName.trim());
      toast.success(`Created workspace "${ws.name}"`);
      setNewName("");
      setCreateOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateClientWorkspace(editingId, { name: editName.trim() });
      toast.success("Workspace updated");
      setEditingId(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteClientWorkspace(deletingId);
      toast.success("Workspace deleted");
      setDeletingId(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleOpenWorkspace = (ws: Workspace) => {
    switchWorkspace(ws.id);
    navigate("/app");
  };

  // Non-firm users: upsell
  if (!isAccountingFirm) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Client Workspaces</h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Client workspaces are available on the Accounting Firm plan. Upgrade to manage
          up to 10 separate client environments from one account.
        </p>
        <Button variant="default" className="mt-4">Upgrade to Firm Plan</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* ═══ Page Header ═══ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Firm Dashboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage all your client workspaces from one place.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={clientWorkspaces.length >= maxWorkspaces} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Create New Workspace
        </Button>
      </div>

      {/* ═══ Summary Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Briefcase}
          label="Client Workspaces"
          value={activeWsCount}
          accent="bg-primary/10 text-primary"
          subtext={`of ${maxWorkspaces} available`}
        />
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={totalDocs}
          accent="bg-[hsl(var(--violet-soft))] text-[hsl(var(--violet))]"
          subtext="across all workspaces"
        />
        <StatCard
          icon={Eye}
          label="Needs Review"
          value={needsReview}
          accent={needsReview > 0 ? "bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]" : "bg-[hsl(var(--emerald-soft))] text-[hsl(var(--emerald))]"}
          subtext={needsReview > 0 ? "documents pending" : "all clear"}
        />
        <StatCard
          icon={Download}
          label="Exports"
          value={totalExports}
          accent="bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]"
          subtext="generated total"
        />
      </div>

      {/* ═══ Usage Overview ═══ */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Workspace Usage</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {clientWorkspaces.length} of {maxWorkspaces} workspace slots used
              </p>
            </div>
            <Badge variant={clientWorkspaces.length >= maxWorkspaces ? "destructive" : "secondary"} className="text-[10px]">
              {maxWorkspaces - clientWorkspaces.length} remaining
            </Badge>
          </div>
          <Progress value={(clientWorkspaces.length / maxWorkspaces) * 100} className="h-2" />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-muted-foreground">0</span>
            <span className="text-[10px] text-muted-foreground">{maxWorkspaces}</span>
          </div>
        </CardContent>
      </Card>

      {/* ═══ Client Workspaces Section ═══ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Client Workspaces</h2>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workspaces..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            <div className="flex border border-border rounded-md">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid view */}
        {viewMode === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {filteredWorkspaces.map((ws) => {
                const stats = wsStats[ws.id] || { docs: 0, review: 0, lastActivity: null };
                return (
                  <motion.div
                    key={ws.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card className={`group hover:shadow-md transition-all cursor-pointer ${activeWorkspace?.id === ws.id ? "ring-2 ring-primary/30 border-primary/40" : "hover:border-border/80"}`}>
                      <CardContent className="p-5 space-y-4" onClick={() => handleOpenWorkspace(ws)}>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{ws.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {stats.lastActivity
                                  ? `Active ${formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true })}`
                                  : "No activity yet"}
                              </p>
                            </div>
                          </div>
                          {activeWorkspace?.id === ws.id && (
                            <Badge className="bg-primary/10 text-primary border-0 text-[9px] shrink-0">Active</Badge>
                          )}
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-accent/50 rounded-lg px-3 py-2 text-center">
                            <p className="text-lg font-bold text-foreground tabular-nums">{stats.docs}</p>
                            <p className="text-[10px] text-muted-foreground">Documents</p>
                          </div>
                          <div className={`rounded-lg px-3 py-2 text-center ${stats.review > 0 ? "bg-[hsl(var(--amber-soft))]" : "bg-accent/50"}`}>
                            <p className={`text-lg font-bold tabular-nums ${stats.review > 0 ? "text-[hsl(var(--amber))]" : "text-foreground"}`}>{stats.review}</p>
                            <p className="text-[10px] text-muted-foreground">Needs Review</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => handleOpenWorkspace(ws)}>
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(ws.id); setEditName(ws.name); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(ws.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Create card */}
            {clientWorkspaces.length < maxWorkspaces && (
              <Card
                className="border-dashed hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer group"
                onClick={() => setCreateOpen(true)}
              >
                <CardContent className="p-5 flex flex-col items-center justify-center min-h-[180px] gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Add Client</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Create a new workspace</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* List view */}
        {viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company</th>
                      <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Documents</th>
                      <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last Activity</th>
                      <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkspaces.map((ws) => {
                      const stats = wsStats[ws.id] || { docs: 0, review: 0, lastActivity: null };
                      return (
                        <tr key={ws.id} className="border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <span className="font-medium text-foreground">{ws.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums font-medium">{stats.docs}</td>
                          <td className="px-4 py-3 text-center">
                            {stats.review > 0 ? (
                              <Badge variant="secondary" className="bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))] border-0 text-[10px]">
                                {stats.review}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {stats.lastActivity
                              ? formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true })
                              : "No activity"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {activeWorkspace?.id === ws.id ? (
                              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Idle</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => handleOpenWorkspace(ws)}>
                                <ArrowRight className="h-3 w-3 mr-1" />
                                Open
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingId(ws.id); setEditName(ws.name); }}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(ws.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredWorkspaces.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          {searchQuery ? "No workspaces match your search." : "No client workspaces yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══ Recent Activity ═══ */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
            </div>
            {recentActivity.length > 0 ? (
              <div>
                {recentActivity.map((item, i) => {
                  const iconMap: Record<string, { icon: React.ElementType; accent: string }> = {
                    upload: { icon: FileText, accent: "bg-primary/10 text-primary" },
                    processed: { icon: CheckCircle2, accent: "bg-[hsl(var(--emerald-soft))] text-[hsl(var(--emerald))]" },
                    approved: { icon: CheckCircle2, accent: "bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]" },
                    export: { icon: Download, accent: "bg-[hsl(var(--violet-soft))] text-[hsl(var(--violet))]" },
                  };
                  const { icon, accent } = iconMap[item.type] || iconMap.upload;
                  return (
                    <ActivityItem
                      key={i}
                      icon={icon}
                      text={item.text}
                      time={formatDistanceToNow(new Date(item.time), { addSuffix: true })}
                      accent={accent}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                No recent activity across workspaces.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start h-10 text-[13px]"
                onClick={() => setCreateOpen(true)}
                disabled={clientWorkspaces.length >= maxWorkspaces}
              >
                <Plus className="h-4 w-4 mr-2 text-primary" />
                New Client Workspace
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-10 text-[13px]"
                onClick={() => navigate("/app/settings?tab=billing")}
              >
                <Receipt className="h-4 w-4 mr-2 text-muted-foreground" />
                Manage Billing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-10 text-[13px]"
                onClick={() => navigate("/app/settings?tab=organization")}
              >
                <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                Firm Settings
              </Button>
            </div>

            <Separator />

            {/* Workspace slots visual */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Workspace Slots</p>
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: maxWorkspaces }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-6 rounded-md transition-colors ${
                      i < clientWorkspaces.length
                        ? "bg-primary/80"
                        : "bg-accent border border-border/60"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {clientWorkspaces.length} used · {maxWorkspaces - clientWorkspaces.length} available
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ Dialogs ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Client Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Client / Company Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Acme Corp"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim() || creating}>
              {creating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create Workspace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Client Workspace</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Workspace Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEdit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Client Workspace
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the workspace and all its documents, expenses, income records, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
