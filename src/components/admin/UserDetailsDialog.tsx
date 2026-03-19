import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, UserCheck, KeyRound, ShieldAlert, ShieldCheck, FileText, DollarSign, TrendingUp, Download, Ban, Building2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface UserRow {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  status: string | null;
  created_at: string;
  role?: string;
}

interface ActivityData {
  documents: { id: string; file_name: string; status: string; created_at: string }[];
  expenses: { id: string; supplier_name: string; total_amount: number; currency: string; created_at: string }[];
  income: { id: string; customer_name: string; total_amount: number; currency: string; created_at: string }[];
  exports: { id: string; export_name: string; format: string; row_count: number; created_at: string }[];
}

function displayName(u: UserRow) {
  return u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown";
}

export function UserDetailsDialog({
  user,
  onClose,
  onActAs,
  onRefresh,
}: {
  user: UserRow | null;
  onClose: () => void;
  onActAs: (u: UserRow) => void;
  onRefresh: () => void;
}) {
  const [tab, setTab] = useState("details");
  const [changingRole, setChangingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user?.role || "user");
  const [newPassword, setNewPassword] = useState("");
  const [resettingPw, setResettingPw] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [revokingFirm, setRevokingFirm] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setTab("details");
      setActivity(null);
      setNewPassword("");
    }
  };

  const handleChangeRole = async () => {
    if (!user || selectedRole === user.role) return;
    setChangingRole(true);
    try {
      const res = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "change_role", user_id: user.user_id, role: selectedRole },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success(`Role changed to ${selectedRole.replace("_", " ")}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to change role");
    } finally {
      setChangingRole(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user || !newPassword) return;
    setResettingPw(true);
    try {
      const res = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "reset_password", user_id: user.user_id, new_password: newPassword },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success("Password reset successfully");
      setNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to reset password");
    } finally {
      setResettingPw(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    const newStatus = user.status === "inactive" ? "active" : "inactive";
    setTogglingStatus(true);
    try {
      const res = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "toggle_status", user_id: user.user_id, status: newStatus },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success(`Account ${newStatus === "active" ? "activated" : "suspended"}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleRevokeFirm = async () => {
    if (!user) return;
    setRevokingFirm(true);
    try {
      const res = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "revoke_firm", user_id: user.user_id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success("Firm access revoked, downgraded to standard");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke firm access");
    } finally {
      setRevokingFirm(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    setDeletingUser(true);
    try {
      const res = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "delete_user", user_id: user.user_id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success("User account permanently deleted");
      onClose();
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingUser(false);
    }
  };

  const loadActivity = async () => {
    if (!user || activity) return;
    setLoadingActivity(true);
    try {
      const res = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "get_activity", user_id: user.user_id },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      setActivity(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load activity");
    } finally {
      setLoadingActivity(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{displayName(user)}</DialogTitle>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === "activity") loadActivity(); }}>
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="manage" className="flex-1">Manage</TabsTrigger>
            <TabsTrigger value="activity" className="flex-1">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { l: "Role", v: (user.role || "user").replace("_", " ") },
                { l: "Status", v: user.status || "active" },
                { l: "Created", v: new Date(user.created_at).toLocaleString() },
              ].map((f) => (
                <div key={f.l}>
                  <p className="text-xs text-muted-foreground">{f.l}</p>
                  <p className="text-sm font-medium capitalize">{f.v}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => { onClose(); onActAs(user); }}>
              <UserCheck className="h-3.5 w-3.5 mr-2" /> Act as this user
            </Button>
          </TabsContent>

          <TabsContent value="manage" className="space-y-5 mt-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Change Role */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5" /> Change Role
              </Label>
              <div className="flex gap-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="platform_admin">Platform Admin</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={handleChangeRole} disabled={changingRole || selectedRole === user.role}>
                  {changingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Reset Password */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <KeyRound className="h-3.5 w-3.5" /> Reset Password
              </Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="New password (min 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleResetPassword} disabled={resettingPw || newPassword.length < 6}>
                  {resettingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Suspend / Activate */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Ban className="h-3.5 w-3.5" /> Suspend Access
              </Label>
              <p className="text-xs text-muted-foreground">
                {user.status === "inactive"
                  ? "This account is currently suspended. The user cannot log in."
                  : "Block the user from logging in. Their data is preserved."}
              </p>
              <Button
                variant={user.status === "inactive" ? "default" : "destructive"}
                size="sm"
                className="w-full"
                onClick={handleToggleStatus}
                disabled={togglingStatus}
              >
                {togglingStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : user.status === "inactive" ? (
                  <ShieldCheck className="h-4 w-4 mr-2" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )}
                {user.status === "inactive" ? "Activate Account" : "Suspend"}
              </Button>
            </div>

            <Separator />

            {/* Revoke Firm Access */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" /> Revoke Firm Access
              </Label>
              <p className="text-xs text-muted-foreground">
                Downgrade to standard account (removes multi-workspace access)
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full" disabled={revokingFirm}>
                    {revokingFirm ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
                    Revoke
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Revoke Firm Access?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will downgrade all firm organizations owned by this user to standard accounts, remove all team members, and detach client workspaces.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevokeFirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Revoke
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            <Separator />

            {/* Delete User */}
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5 text-destructive">
                <Trash2 className="h-3.5 w-3.5" /> Delete Account
              </Label>
              <p className="text-xs text-muted-foreground">
                Permanently delete this user, all workspaces, and related data. This cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="w-full" disabled={deletingUser}>
                    {deletingUser ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User Account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the user "{displayName(user)}" ({user.email}), all their organizations, workspaces, documents, expenses, income records, and authentication. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Permanently
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            {loadingActivity ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : !activity ? (
              <p className="text-sm text-muted-foreground text-center py-8">No activity data</p>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {(() => {
                  const items: { type: string; icon: typeof FileText; label: string; detail: string; date: string }[] = [];

                  activity.documents.forEach((d) => items.push({
                    type: "document", icon: FileText, label: d.file_name, detail: d.status, date: d.created_at,
                  }));
                  activity.expenses.forEach((e) => items.push({
                    type: "expense", icon: DollarSign, label: e.supplier_name, detail: `${e.currency} ${Number(e.total_amount).toFixed(2)}`, date: e.created_at,
                  }));
                  activity.income.forEach((i) => items.push({
                    type: "income", icon: TrendingUp, label: i.customer_name, detail: `${i.currency} ${Number(i.total_amount).toFixed(2)}`, date: i.created_at,
                  }));
                  activity.exports.forEach((x) => items.push({
                    type: "export", icon: Download, label: x.export_name, detail: `${x.format.toUpperCase()} · ${x.row_count} rows`, date: x.created_at,
                  }));

                  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  if (items.length === 0) {
                    return <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>;
                  }

                  return items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="mt-0.5 h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[10px] capitalize">{item.type}</Badge>
                          <span className="text-xs text-muted-foreground">{item.detail}</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                  ));
                })()}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
