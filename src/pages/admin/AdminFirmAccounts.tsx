import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Search, Loader2, RefreshCw, Eye, Shield, ShieldOff, Plus, Minus,
  CreditCard, CheckCircle2, XCircle, Archive, Trash2, Briefcase, BarChart3,
  FileText, Clock, AlertTriangle, Ban, UserCheck,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface FirmAccount {
  id: string;
  name: string;
  owner_user_id: string;
  owner_email: string | null;
  owner_name: string | null;
  owner_status: string;
  workspace_type: string;
  max_client_workspaces: number;
  workspace_count: number;
  payment_status: string;
  billing_setup_at: string | null;
  created_at: string;
  updated_at: string;
}

interface FirmWorkspace {
  id: string;
  name: string;
  trading_name: string | null;
  country: string | null;
  default_currency: string;
  archived_at: string | null;
  created_at: string;
  doc_count: number;
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  paid: { label: "Paid", className: "bg-primary/10 text-primary" },
  unpaid: { label: "Unpaid", className: "bg-destructive/10 text-destructive" },
  no_customer: { label: "No Customer", className: "bg-muted text-muted-foreground" },
  unknown: { label: "Unknown", className: "bg-muted text-muted-foreground" },
  error: { label: "Error", className: "bg-destructive/10 text-destructive" },
};

const ownerStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-primary/10 text-primary" },
  inactive: { label: "Suspended", className: "bg-destructive/10 text-destructive" },
};

export default function AdminFirmAccounts() {
  const [firms, setFirms] = useState<FirmAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();

  // Detail view
  const [selectedFirm, setSelectedFirm] = useState<FirmAccount | null>(null);
  const [firmWorkspaces, setFirmWorkspaces] = useState<FirmWorkspace[]>([]);
  const [wsLoading, setWsLoading] = useState(false);

  // Actions
  const [adjustLimitOpen, setAdjustLimitOpen] = useState(false);
  const [newLimit, setNewLimit] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: string; label: string; orgId: string; userId?: string } | null>(null);

  // Grant access dialog
  const [grantAccessOpen, setGrantAccessOpen] = useState(false);
  const [grantOrgSearch, setGrantOrgSearch] = useState("");
  const [allStandardOrgs, setAllStandardOrgs] = useState<any[]>([]);
  const [grantOrgsLoading, setGrantOrgsLoading] = useState(false);

  const fetchFirms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-firm-management", {
        body: { action: "list_firms" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFirms(data.firms || []);
    } catch (err: any) {
      toast.error("Failed to load firm accounts: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFirms(); }, []);

  const fetchWorkspaces = async (orgId: string) => {
    setWsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-firm-management", {
        body: { action: "list_firm_workspaces", org_id: orgId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setFirmWorkspaces(data.workspaces || []);
    } catch (err: any) {
      toast.error("Failed to load workspaces");
    } finally {
      setWsLoading(false);
    }
  };

  const openFirmDetail = (firm: FirmAccount) => {
    setSelectedFirm(firm);
    fetchWorkspaces(firm.id);
  };

  const handleAction = async (actionType: string, params: Record<string, any>) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-firm-management", {
        body: { action: actionType, ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Action completed successfully");
      fetchFirms();
      if (selectedFirm) fetchWorkspaces(selectedFirm.id);
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const handleAdjustLimit = async () => {
    if (!selectedFirm) return;
    await handleAction("adjust_workspace_limit", { org_id: selectedFirm.id, new_limit: newLimit });
    setAdjustLimitOpen(false);
    setSelectedFirm(prev => prev ? { ...prev, max_client_workspaces: newLimit } : null);
  };

  const fetchStandardOrgs = async () => {
    setGrantOrgsLoading(true);
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, name, owner_user_id, workspace_type, created_at")
        .eq("workspace_type", "standard")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with owner email — fetch all profiles at once
      const ownerIds = [...new Set((data || []).map((o: any) => o.owner_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email")
        .in("user_id", ownerIds.length > 0 ? ownerIds : ["__none__"]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p.email]));
      const enriched = (data || []).map((org: any) => ({
        ...org,
        owner_email: profileMap.get(org.owner_user_id) || null,
      }));
      setAllStandardOrgs(enriched);
    } catch (err: any) {
      console.error("Failed to load organizations:", err);
      toast.error("Failed to load organizations: " + (err.message || "Unknown error"));
    } finally {
      setGrantOrgsLoading(false);
    }
  };

  const filtered = firms.filter((f) =>
    (f.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.owner_email || "").toLowerCase().includes(search.toLowerCase()) ||
    (f.owner_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalWorkspaces = firms.reduce((sum, f) => sum + f.workspace_count, 0);
  const totalPaid = firms.filter((f) => f.payment_status === "paid").length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{firms.length}</p>
                <p className="text-[11px] text-muted-foreground">Firm Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-accent flex items-center justify-center">
                <Briefcase className="h-4.5 w-4.5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalWorkspaces}</p>
                <p className="text-[11px] text-muted-foreground">Total Workspaces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalPaid}</p>
                <p className="text-[11px] text-muted-foreground">Paid Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{firms.length - totalPaid}</p>
                <p className="text-[11px] text-muted-foreground">Unpaid / Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search firms..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={fetchFirms} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button size="sm" onClick={() => { setGrantAccessOpen(true); fetchStandardOrgs(); }}>
          <Plus className="h-4 w-4 mr-1" /> Grant Firm Access
        </Button>
      </div>

      {/* Firms table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {firms.length === 0 ? "No accounting firm accounts found" : "No firms match your search"}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((firm) => (
            <MobileRecordCard
              key={firm.id}
              title={firm.name}
              subtitle={firm.owner_email || "No email"}
              badge={{
                label: paymentStatusConfig[firm.payment_status]?.label || "Unknown",
                className: paymentStatusConfig[firm.payment_status]?.className || "",
              }}
              fields={[
                { label: "Owner", value: firm.owner_name || "—" },
                { label: "Workspaces", value: `${firm.workspace_count}/${firm.max_client_workspaces}` },
                { label: "Created", value: new Date(firm.created_at).toLocaleDateString() },
              ]}
              onClick={() => openFirmDetail(firm)}
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">Firm Name</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Owner</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Plan</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Workspaces</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Payment</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Created</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((firm) => {
                    const ps = paymentStatusConfig[firm.payment_status] || paymentStatusConfig.unknown;
                    const os = ownerStatusConfig[firm.owner_status] || ownerStatusConfig.active;
                    return (
                      <tr key={firm.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-medium">{firm.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm">{firm.owner_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{firm.owner_email}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className="bg-accent text-accent-foreground text-[10px]">
                            Accounting Firm
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium tabular-nums">
                              {firm.workspace_count}/{firm.max_client_workspaces}
                            </span>
                            <Progress
                              value={(firm.workspace_count / firm.max_client_workspaces) * 100}
                              className="h-1.5 w-16"
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={`text-[10px] ${ps.className}`}>
                            {ps.label}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={`text-[10px] ${os.className}`}>
                            {os.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(firm.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openFirmDetail(firm)} title="View details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ Firm Detail Dialog ═══ */}
      <Dialog open={!!selectedFirm} onOpenChange={(open) => { if (!open) setSelectedFirm(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedFirm && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  {selectedFirm.name}
                </DialogTitle>
                <DialogDescription>
                  Managed by {selectedFirm.owner_name || selectedFirm.owner_email || "Unknown"}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                {/* ── Overview ── */}
                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">Owner</p>
                      <p className="text-sm font-medium">{selectedFirm.owner_name || "—"}</p>
                      <p className="text-xs text-muted-foreground">{selectedFirm.owner_email}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">Payment Status</p>
                      <Badge variant="secondary" className={paymentStatusConfig[selectedFirm.payment_status]?.className || ""}>
                        {paymentStatusConfig[selectedFirm.payment_status]?.label || "Unknown"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">Workspaces</p>
                      <p className="text-sm font-medium">{selectedFirm.workspace_count} / {selectedFirm.max_client_workspaces}</p>
                      <Progress value={(selectedFirm.workspace_count / selectedFirm.max_client_workspaces) * 100} className="h-2 mt-1" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">Account Status</p>
                      <Badge variant="secondary" className={ownerStatusConfig[selectedFirm.owner_status]?.className || ""}>
                        {ownerStatusConfig[selectedFirm.owner_status]?.label || "Active"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">Created</p>
                      <p className="text-sm">{new Date(selectedFirm.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase text-muted-foreground">Billing Setup</p>
                      <p className="text-sm">{selectedFirm.billing_setup_at ? new Date(selectedFirm.billing_setup_at).toLocaleDateString() : "Not set"}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* ── Workspaces ── */}
                <TabsContent value="workspaces" className="mt-4">
                  {wsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : firmWorkspaces.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No client workspaces created yet
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {firmWorkspaces.map((ws) => (
                        <Card key={ws.id} className={ws.archived_at ? "opacity-60" : ""}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center">
                                <Briefcase className="h-4 w-4 text-accent-foreground" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">{ws.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-muted-foreground">{ws.doc_count} docs</span>
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground">{ws.default_currency}</span>
                                  {ws.country && (
                                    <>
                                      <span className="text-xs text-muted-foreground">·</span>
                                      <span className="text-xs text-muted-foreground">{ws.country}</span>
                                    </>
                                  )}
                                  <span className="text-xs text-muted-foreground">·</span>
                                  <span className="text-xs text-muted-foreground">{new Date(ws.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {ws.archived_at ? (
                                <Badge variant="secondary" className="text-[10px] bg-muted text-muted-foreground">Archived</Badge>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost" size="icon" className="h-7 w-7"
                                    onClick={() => setConfirmAction({ type: "archive_workspace", label: `Archive "${ws.name}"?`, orgId: ws.id })}
                                    title="Archive"
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                                    onClick={() => setConfirmAction({ type: "delete_workspace", label: `Permanently delete "${ws.name}"? This cannot be undone.`, orgId: ws.id })}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── Actions ── */}
                <TabsContent value="actions" className="mt-4">
                  <div className="grid gap-3">
                    {/* Adjust workspace limit */}
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Workspace Limit</p>
                          <p className="text-xs text-muted-foreground">Current: {selectedFirm.max_client_workspaces} workspaces</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => { setNewLimit(selectedFirm.max_client_workspaces); setAdjustLimitOpen(true); }}>
                          Adjust Limit
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Mark as paid */}
                    {selectedFirm.payment_status !== "paid" && (
                      <Card>
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Mark as Paid</p>
                            <p className="text-xs text-muted-foreground">Manually confirm payment and grant full access</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setConfirmAction({ type: "mark_as_paid", label: "Mark this account as paid? This grants full firm access.", orgId: selectedFirm.id })}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark Paid
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Suspend/restore */}
                    <Card>
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {selectedFirm.owner_status === "inactive" ? "Restore Access" : "Suspend Access"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedFirm.owner_status === "inactive"
                              ? "Re-enable login for this firm owner"
                              : "Block the firm owner from logging in"}
                          </p>
                        </div>
                        <Button
                          variant={selectedFirm.owner_status === "inactive" ? "default" : "destructive"}
                          size="sm"
                          onClick={() => setConfirmAction({
                            type: "toggle_firm_status",
                            label: selectedFirm.owner_status === "inactive"
                              ? "Restore access for this firm owner?"
                              : "Suspend this firm owner? They won't be able to log in.",
                            orgId: selectedFirm.id,
                            userId: selectedFirm.owner_user_id,
                          })}
                        >
                          {selectedFirm.owner_status === "inactive" ? (
                            <><UserCheck className="h-3.5 w-3.5 mr-1" /> Restore</>
                          ) : (
                            <><Ban className="h-3.5 w-3.5 mr-1" /> Suspend</>
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Revoke firm access */}
                    <Card className="border-destructive/20">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-destructive">Revoke Firm Access</p>
                          <p className="text-xs text-muted-foreground">Downgrade to standard account (removes multi-workspace access)</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmAction({
                            type: "revoke_firm_access",
                            label: "Revoke firm access? This downgrades the account to standard and removes multi-workspace capabilities.",
                            orgId: selectedFirm.id,
                          })}
                        >
                          <ShieldOff className="h-3.5 w-3.5 mr-1" /> Revoke
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Delete firm account */}
                    <Card className="border-destructive/30 bg-destructive/5">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-destructive">Delete Firm Account</p>
                          <p className="text-xs text-muted-foreground">Permanently delete this firm, all client workspaces, and related data. This cannot be undone.</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setConfirmAction({
                            type: "delete_firm",
                            label: `Permanently delete "${selectedFirm.name}" and all its ${selectedFirm.workspace_count} client workspaces? All documents, expenses, and data will be lost. This cannot be undone.`,
                            orgId: selectedFirm.id,
                          })}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Firm
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Adjust Limit Dialog ═══ */}
      <Dialog open={adjustLimitOpen} onOpenChange={setAdjustLimitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Workspace Limit</DialogTitle>
            <DialogDescription>Set the maximum number of client workspaces for this firm.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setNewLimit(Math.max(1, newLimit - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min={1}
                max={100}
                value={newLimit}
                onChange={(e) => setNewLimit(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-center text-lg font-bold w-20"
              />
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setNewLimit(newLimit + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustLimitOpen(false)}>Cancel</Button>
            <Button onClick={handleAdjustLimit} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Grant Firm Access Dialog ═══ */}
      <Dialog open={grantAccessOpen} onOpenChange={setGrantAccessOpen}>
        <DialogContent className="max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Grant Firm Access</DialogTitle>
            <DialogDescription>Upgrade a standard organization to an accounting firm account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search organizations..." className="pl-9" value={grantOrgSearch} onChange={(e) => setGrantOrgSearch(e.target.value)} />
            </div>
            {grantOrgsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {allStandardOrgs
                  .filter((o) =>
                    o.name.toLowerCase().includes(grantOrgSearch.toLowerCase()) ||
                    (o.owner_email || "").toLowerCase().includes(grantOrgSearch.toLowerCase())
                  )
                  .map((org) => (
                    <Card key={org.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={async () => {
                      await handleAction("grant_firm_access", { org_id: org.id, max_workspaces: 10 });
                      setGrantAccessOpen(false);
                    }}>
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{org.name}</p>
                          <p className="text-xs text-muted-foreground">{org.owner_email || "No email"}</p>
                        </div>
                        <Shield className="h-4 w-4 text-primary" />
                      </CardContent>
                    </Card>
                  ))}
                {allStandardOrgs.filter((o) =>
                  o.name.toLowerCase().includes(grantOrgSearch.toLowerCase()) ||
                  (o.owner_email || "").toLowerCase().includes(grantOrgSearch.toLowerCase())
                ).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No standard organizations found</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Confirm Action Dialog ═══ */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>{confirmAction?.label}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={actionLoading}
              onClick={() => {
                if (!confirmAction) return;
                const params: Record<string, any> = { org_id: confirmAction.orgId };
                if (confirmAction.type === "toggle_firm_status") {
                  params.user_id = confirmAction.userId;
                  params.status = selectedFirm?.owner_status === "inactive" ? "active" : "inactive";
                }
                handleAction(confirmAction.type, params);
              }}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
