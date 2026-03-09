import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWorkspace, Workspace, CreateWorkspaceData, UpdateWorkspaceData } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2, Briefcase, Plus, Trash2, Pencil, FileText, Receipt,
  ArrowRight, Loader2, AlertTriangle, Clock, Download, Eye,
  CheckCircle2, Search, LayoutGrid, List, Archive, ArchiveRestore,
  Activity, BarChart3, Globe, Mail, Phone, Hash, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ClientAccessPanel } from "@/components/ClientAccessPanel";
import { useSendClientInvitation } from "@/hooks/useClientInvitations";

const CURRENCIES = [
  { value: "EUR", label: "EUR – Euro" },
  { value: "USD", label: "USD – US Dollar" },
  { value: "GBP", label: "GBP – British Pound" },
  { value: "CHF", label: "CHF – Swiss Franc" },
  { value: "SEK", label: "SEK – Swedish Krona" },
  { value: "NOK", label: "NOK – Norwegian Krone" },
  { value: "DKK", label: "DKK – Danish Krone" },
  { value: "PLN", label: "PLN – Polish Zloty" },
  { value: "CZK", label: "CZK – Czech Koruna" },
];

const COUNTRIES = [
  { value: "NL", label: "Netherlands" },
  { value: "BE", label: "Belgium" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "CH", label: "Switzerland" },
  { value: "AT", label: "Austria" },
  { value: "ES", label: "Spain" },
  { value: "IT", label: "Italy" },
  { value: "SE", label: "Sweden" },
  { value: "NO", label: "Norway" },
  { value: "DK", label: "Denmark" },
  { value: "PL", label: "Poland" },
  { value: "CZ", label: "Czech Republic" },
  { value: "PT", label: "Portugal" },
  { value: "IE", label: "Ireland" },
  { value: "LU", label: "Luxembourg" },
];

const emptyForm: CreateWorkspaceData = {
  name: "", trading_name: "", vat_number: "", tax_id: "",
  address: "", country: "NL", default_currency: "EUR",
  contact_email: "", contact_phone: "",
};

/* ── Stat card ── */
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

/* ── Form field helper ── */
function Field({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}{optional && <span className="text-muted-foreground/50 ml-1">(optional)</span>}
      </Label>
      {children}
    </div>
  );
}

export default function WorkspacesPage() {
  const {
    activeWorkspace, allWorkspaces, isAccountingFirm, clientWorkspaces,
    switchWorkspace, createClientWorkspace, deleteClientWorkspace,
    updateClientWorkspace, archiveClientWorkspace, unarchiveClientWorkspace,
  } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState<CreateWorkspaceData>({ ...emptyForm });
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);
  const [sendInvite, setSendInvite] = useState(false);
  const [clientContactName, setClientContactName] = useState("");
  const sendClientInvitation = useSendClientInvitation();

  const [editOpen, setEditOpen] = useState(false);
  const [editingWs, setEditingWs] = useState<Workspace | null>(null);
  const [editData, setEditData] = useState<UpdateWorkspaceData>({});

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const searchQuery = "";
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showArchived, setShowArchived] = useState(false);

  const homeOrg = allWorkspaces.find(
    (w) => w.workspace_type === "accounting_firm" || w.workspace_type === "standard"
  );
  const maxWorkspaces = homeOrg?.max_client_workspaces || 10;

  const allClientWorkspaces = allWorkspaces.filter((w) => w.workspace_type === "client");
  const archivedWorkspaces = allClientWorkspaces.filter((w) => w.archived_at);
  const activeClientCount = clientWorkspaces.length; // already excludes archived

  const clientOrgIds = useMemo(() => allClientWorkspaces.map((w) => w.id), [allClientWorkspaces]);

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

  const totalDocs = allDocs.length;
  const needsReview = allDocs.filter((d) => d.status === "processed").length;
  const totalExports = allExports.length;

  const wsStats = useMemo(() => {
    const map: Record<string, { docs: number; review: number; lastActivity: string | null }> = {};
    for (const ws of allClientWorkspaces) {
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
  }, [allClientWorkspaces, allDocs]);

  const recentActivity = useMemo(() => {
    const items: { type: string; text: string; time: string }[] = [];
    const wsMap = Object.fromEntries(allClientWorkspaces.map((w) => [w.id, w.name]));
    for (const doc of allDocs.slice(0, 20)) {
      const wsName = doc.organization_id ? wsMap[doc.organization_id] || "Unknown" : "Unknown";
      if (doc.status === "processing") items.push({ type: "upload", text: `"${doc.file_name}" uploaded in ${wsName}`, time: doc.created_at });
      else if (doc.status === "processed") items.push({ type: "processed", text: `"${doc.file_name}" processed in ${wsName}`, time: doc.created_at });
      else if (doc.status === "approved") items.push({ type: "approved", text: `"${doc.file_name}" approved in ${wsName}`, time: doc.created_at });
    }
    for (const exp of allExports.slice(0, 5)) {
      const wsName = exp.organization_id ? wsMap[exp.organization_id] || "Unknown" : "Unknown";
      items.push({ type: "export", text: `Export "${exp.export_name}" (${exp.format}) from ${wsName}`, time: exp.created_at });
    }
    return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);
  }, [allDocs, allExports, allClientWorkspaces]);

  const displayedWorkspaces = (showArchived ? archivedWorkspaces : clientWorkspaces)
    .filter((ws) => ws.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // ── Handlers ──
  const handleCreate = async () => {
    if (!formData.name.trim() || creatingRef.current) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const ws = await createClientWorkspace({ ...formData, name: formData.name.trim() });

      // Send client invitation if requested
      if (sendInvite && formData.contact_email && clientContactName.trim()) {
        try {
          await sendClientInvitation.mutateAsync({
            workspace_id: ws.id,
            client_name: clientContactName.trim(),
            client_email: formData.contact_email.trim(),
          });
          toast.success(`Created workspace "${ws.name}" and sent client invitation`);
        } catch {
          toast.success(`Created workspace "${ws.name}". Failed to send invitation — you can retry later.`);
        }
      } else {
        toast.success(`Created workspace "${ws.name}"`);
      }

      setFormData({ ...emptyForm });
      setSendInvite(false);
      setClientContactName("");
      setCreateOpen(false);
      await switchWorkspace(ws.id);
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      creatingRef.current = false;
      setCreating(false);
    }
  };

  const openEditDialog = (ws: Workspace) => {
    setEditingWs(ws);
    setEditData({
      name: ws.name,
      trading_name: ws.trading_name || "",
      vat_number: ws.vat_number || "",
      tax_id: ws.tax_id || "",
      address: ws.address || "",
      country: ws.country || "NL",
      default_currency: ws.default_currency || "EUR",
      contact_email: ws.contact_email || "",
      contact_phone: ws.contact_phone || "",
    });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingWs || !editData.name?.trim()) return;
    try {
      await updateClientWorkspace(editingWs.id, { ...editData, name: editData.name!.trim() });
      toast.success("Workspace updated");
      setEditOpen(false);
      setEditingWs(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleArchive = async () => {
    if (!archivingId) return;
    try {
      await archiveClientWorkspace(archivingId);
      toast.success("Workspace archived");
      setArchivingId(null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUnarchive = async (orgId: string) => {
    try {
      await unarchiveClientWorkspace(orgId);
      toast.success("Workspace restored");
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

  const updateField = (field: keyof CreateWorkspaceData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const updateEditField = (field: keyof UpdateWorkspaceData, value: string) =>
    setEditData((prev) => ({ ...prev, [field]: value }));

  // ── Non-firm upsell ──
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

  /* ── Workspace form fields (shared between create & edit) ── */
  const renderFormFields = (
    data: CreateWorkspaceData | UpdateWorkspaceData,
    onChange: (field: any, value: string) => void,
  ) => (
    <div className="space-y-5">
      {/* Company details */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Company Details</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Company Name">
            <Input value={data.name || ""} onChange={(e) => onChange("name", e.target.value)} placeholder="e.g. Acme Corp BV" />
          </Field>
          <Field label="Trading Name" optional>
            <Input value={data.trading_name || ""} onChange={(e) => onChange("trading_name", e.target.value)} placeholder="e.g. Acme" />
          </Field>
        </div>
      </div>

      {/* Tax info */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tax Information</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="VAT Number" optional>
            <Input value={data.vat_number || ""} onChange={(e) => onChange("vat_number", e.target.value)} placeholder="e.g. NL123456789B01" />
          </Field>
          <Field label="Tax ID / KVK" optional>
            <Input value={data.tax_id || ""} onChange={(e) => onChange("tax_id", e.target.value)} placeholder="e.g. 12345678" />
          </Field>
        </div>
      </div>

      {/* Location & Currency */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Location & Currency</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Country">
            <Select value={data.country || "NL"} onValueChange={(v) => onChange("country", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Base Currency">
            <Select value={data.default_currency || "EUR"} onValueChange={(v) => onChange("default_currency", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address" optional>
              <Textarea
                value={data.address || ""}
                onChange={(e) => onChange("address", e.target.value)}
                placeholder="Street, city, postal code"
                className="min-h-[60px] resize-none text-sm"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Contact</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Contact Email" optional>
            <Input type="email" value={data.contact_email || ""} onChange={(e) => onChange("contact_email", e.target.value)} placeholder="finance@acme.com" />
          </Field>
          <Field label="Contact Phone" optional>
            <Input type="tel" value={data.contact_phone || ""} onChange={(e) => onChange("contact_phone", e.target.value)} placeholder="+31 6 12345678" />
          </Field>
        </div>
      </div>
    </div>
  );

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
        <Button
          onClick={() => { setFormData({ ...emptyForm }); setCreateOpen(true); }}
          disabled={activeClientCount >= maxWorkspaces}
          size="sm"
          className="shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create New Workspace
        </Button>
      </div>

      {/* Limit banner */}
      {activeClientCount >= maxWorkspaces && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Workspace limit reached</p>
              <p className="text-xs text-muted-foreground">
                You've used all {maxWorkspaces} workspace slots. Archive or delete an existing workspace to create a new one.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Summary Stats ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Briefcase} label="Client Workspaces" value={activeClientCount} accent="bg-primary/10 text-primary" subtext={`of ${maxWorkspaces} available`} />
        <StatCard icon={FileText} label="Total Documents" value={totalDocs} accent="bg-[hsl(var(--violet-soft))] text-[hsl(var(--violet))]" subtext="across all workspaces" />
        <StatCard icon={Eye} label="Needs Review" value={needsReview} accent={needsReview > 0 ? "bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]" : "bg-[hsl(var(--emerald-soft))] text-[hsl(var(--emerald))]"} subtext={needsReview > 0 ? "documents pending" : "all clear"} />
        <StatCard icon={Download} label="Exports" value={totalExports} accent="bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]" subtext="generated total" />
      </div>

      {/* ═══ Usage Overview ═══ */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Workspace Usage</p>
              <p className="text-xs text-muted-foreground mt-0.5">{activeClientCount} of {maxWorkspaces} workspace slots used</p>
            </div>
            <Badge variant={activeClientCount >= maxWorkspaces ? "destructive" : "secondary"} className="text-[10px]">
              {maxWorkspaces - activeClientCount} remaining
            </Badge>
          </div>
          <Progress value={(activeClientCount / maxWorkspaces) * 100} className="h-2" />
        </CardContent>
      </Card>

      {/* ═══ Client Workspaces Section ═══ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-foreground">Client Workspaces</h2>
            {archivedWorkspaces.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <Archive className="h-3 w-3" />
                {showArchived ? "Show active" : `${archivedWorkspaces.length} archived`}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-border rounded-md">
              <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode("list")} className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Grid view */}
        {viewMode === "grid" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {displayedWorkspaces.map((ws) => {
                const stats = wsStats[ws.id] || { docs: 0, review: 0, lastActivity: null };
                const isArchived = !!ws.archived_at;
                return (
                  <motion.div key={ws.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.15 }}>
                    <Card className={`group hover:shadow-md transition-all cursor-pointer ${isArchived ? "opacity-60" : ""} ${activeWorkspace?.id === ws.id ? "ring-2 ring-primary/30 border-primary/40" : "hover:border-border/80"}`}>
                      <CardContent className="p-5 space-y-4" onClick={() => !isArchived && handleOpenWorkspace(ws)}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                              <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{ws.name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {isArchived ? "Archived" : stats.lastActivity
                                  ? `Active ${formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true })}`
                                  : "No activity yet"}
                              </p>
                            </div>
                          </div>
                          {isArchived ? (
                            <Badge variant="outline" className="text-[9px] shrink-0">Archived</Badge>
                          ) : activeWorkspace?.id === ws.id ? (
                            <Badge className="bg-primary/10 text-primary border-0 text-[9px] shrink-0">Active</Badge>
                          ) : null}
                        </div>

                        {!isArchived && (
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
                        )}

                        <div className="flex items-center gap-1.5 pt-1 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
                          {isArchived ? (
                            <>
                              <Button variant="ghost" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => handleUnarchive(ws.id)}>
                                <ArchiveRestore className="h-3 w-3 mr-1" /> Restore
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(ws.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button variant="ghost" size="sm" className="flex-1 h-7 text-[11px]" onClick={() => handleOpenWorkspace(ws)}>
                                <ArrowRight className="h-3 w-3 mr-1" /> Open
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(ws)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setArchivingId(ws.id)}>
                                <Archive className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {!showArchived && activeClientCount < maxWorkspaces && (
              <Card className="border-dashed hover:border-primary/40 hover:bg-primary/[0.02] transition-all cursor-pointer group" onClick={() => { setFormData({ ...emptyForm }); setCreateOpen(true); }}>
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

            {displayedWorkspaces.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 py-12 text-center text-sm text-muted-foreground">
                {searchQuery ? "No workspaces match your search." : showArchived ? "No archived workspaces." : "No client workspaces yet."}
              </div>
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
                      <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Docs</th>
                      <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Review</th>
                      <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Last Activity</th>
                      <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedWorkspaces.map((ws) => {
                      const stats = wsStats[ws.id] || { docs: 0, review: 0, lastActivity: null };
                      const isArchived = !!ws.archived_at;
                      return (
                        <tr key={ws.id} className={`border-b border-border/40 last:border-0 hover:bg-accent/30 transition-colors ${isArchived ? "opacity-60" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                              <div className="min-w-0">
                                <span className="font-medium text-foreground block truncate">{ws.name}</span>
                                {ws.trading_name && <span className="text-[10px] text-muted-foreground">{ws.trading_name}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center tabular-nums font-medium">{stats.docs}</td>
                          <td className="px-4 py-3 text-center">
                            {stats.review > 0 ? (
                              <Badge variant="secondary" className="bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))] border-0 text-[10px]">{stats.review}</Badge>
                            ) : <span className="text-muted-foreground text-xs">—</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {stats.lastActivity ? formatDistanceToNow(new Date(stats.lastActivity), { addSuffix: true }) : "No activity"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isArchived ? (
                              <Badge variant="outline" className="text-[10px]">Archived</Badge>
                            ) : activeWorkspace?.id === ws.id ? (
                              <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Active</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">Idle</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {isArchived ? (
                                <>
                                  <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => handleUnarchive(ws.id)}>
                                    <ArchiveRestore className="h-3 w-3 mr-1" /> Restore
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeletingId(ws.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" className="h-7 text-[11px]" onClick={() => handleOpenWorkspace(ws)}>
                                    <ArrowRight className="h-3 w-3 mr-1" /> Open
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(ws)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setArchivingId(ws.id)}>
                                    <Archive className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {displayedWorkspaces.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          {searchQuery ? "No workspaces match your search." : showArchived ? "No archived workspaces." : "No client workspaces yet."}
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
      <Card>
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
                return <ActivityItem key={i} icon={icon} text={item.text} time={formatDistanceToNow(new Date(item.time), { addSuffix: true })} accent={accent} />;
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

      {/* ═══ Create Dialog ═══ */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Client Workspace</DialogTitle>
            <DialogDescription className="text-xs">
              Set up a new isolated workspace for a client company. You can always edit details later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-5">
            {renderFormFields(formData, updateField)}

            {/* Client invitation option */}
            <div>
              <Separator className="mb-4" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Client Access</p>
              <div className="flex items-start gap-3 bg-accent/30 rounded-lg p-3">
                <Checkbox
                  id="send-invite"
                  checked={sendInvite}
                  onCheckedChange={(c) => setSendInvite(!!c)}
                  className="mt-0.5"
                />
                <div className="space-y-1 flex-1">
                  <label htmlFor="send-invite" className="text-sm font-medium text-foreground cursor-pointer">
                    Send client invitation now
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    Invite the client to log in and access their workspace. Leave unchecked for internal-only workspaces.
                  </p>
                </div>
              </div>
              {sendInvite && (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  <Field label="Client Contact Name">
                    <Input value={clientContactName} onChange={(e) => setClientContactName(e.target.value)} placeholder="e.g. John Doe" />
                  </Field>
                  <Field label="Client Contact Email">
                    <Input type="email" value={formData.contact_email || ""} onChange={(e) => updateField("contact_email", e.target.value)} placeholder="client@company.com" />
                  </Field>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!formData.name.trim() || creating || (sendInvite && (!clientContactName.trim() || !formData.contact_email?.trim()))}>
              {creating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {sendInvite ? "Create & Invite Client" : "Create Workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Edit Dialog ═══ */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client Workspace</DialogTitle>
            <DialogDescription className="text-xs">
              Update workspace details for {editingWs?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-5">
            {renderFormFields(editData, updateEditField)}

            {/* Client Access Panel */}
            {editingWs && (
              <>
                <Separator />
                <ClientAccessPanel
                  workspaceId={editingWs.id}
                  workspaceName={editingWs.name}
                  contactName={(editingWs as any).client_contact_name}
                  contactEmail={(editingWs as any).client_contact_email}
                />
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editData.name?.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Archive Confirm ═══ */}
      <AlertDialog open={!!archivingId} onOpenChange={() => setArchivingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-muted-foreground" />
              Archive Client Workspace
            </AlertDialogTitle>
            <AlertDialogDescription>
              This workspace will be hidden from your active list but all data will be preserved. You can restore it at any time. Archiving frees up a workspace slot.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive Workspace</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ Delete Confirm ═══ */}
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
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
