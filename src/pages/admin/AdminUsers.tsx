import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, RefreshCw, UserCheck, Plus, Pencil, ShieldCheck, Bell, Ban, X, Download } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { UserDetailsDialog } from "@/components/admin/UserDetailsDialog";
import { motion, AnimatePresence } from "framer-motion";

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

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  inactive: "bg-destructive/10 text-destructive",
};

const roleColors: Record<string, string> = {
  platform_admin: "bg-primary/10 text-primary",
  admin: "bg-accent text-accent-foreground",
  moderator: "bg-secondary text-secondary-foreground",
  user: "bg-muted text-muted-foreground",
};

const displayName = (u: UserRow) =>
  u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"role" | "notify" | "deactivate" | null>(null);
  const [bulkRole, setBulkRole] = useState("user");
  const [bulkNotifyTitle, setBulkNotifyTitle] = useState("");
  const [bulkNotifyBody, setBulkNotifyBody] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const isMobile = useIsMobile();
  const { startImpersonating } = useImpersonation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleActAsUser = (user: UserRow) => {
    const name = displayName(user);
    // Invalidate workspace queries BEFORE setting impersonation so fresh data loads
    queryClient.removeQueries({ queryKey: ["workspaces"] });
    queryClient.removeQueries({ queryKey: ["active-workspace-id"] });
    queryClient.removeQueries({ queryKey: ["organization"] });
    startImpersonating({ userId: user.user_id, email: user.email || "Unknown", displayName: name });
    toast.success(`Now viewing as ${name}`);
    navigate("/app");
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string>();
      (roles || []).forEach((r) => roleMap.set(r.user_id, r.role));
      setUsers((profiles || []).map((p) => ({ ...p, role: roleMap.get(p.user_id) || "user" })));
    } catch (err: any) {
      toast.error("Failed to load users: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRefresh = async () => { await fetchUsers(); };

  useEffect(() => {
    if (selected) {
      const updated = users.find((u) => u.user_id === selected.user_id);
      if (updated && (updated.role !== selected.role || updated.status !== selected.status)) setSelected(updated);
    }
  }, [users]);

  const filtered = users.filter((u) => {
    const name = u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const toggleSelect = (userId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(userId) ? next.delete(userId) : next.add(userId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(u => u.user_id)));
    }
  };

  const selectedUsers = users.filter(u => selectedIds.has(u.user_id));

  const handleBulkRoleChange = async () => {
    setBulkProcessing(true);
    try {
      let success = 0;
      for (const userId of selectedIds) {
        const res = await supabase.functions.invoke("admin-manage-user", {
          body: { action: "change_role", user_id: userId, role: bulkRole },
        });
        if (!res.error && !res.data?.error) success++;
      }
      toast.success(`Role updated for ${success} user(s)`);
      setSelectedIds(new Set());
      setBulkAction(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to update roles");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkNotify = async () => {
    if (!bulkNotifyTitle.trim() || !bulkNotifyBody.trim()) return;
    setBulkProcessing(true);
    try {
      const notifications = Array.from(selectedIds).map(user_id => ({
        user_id,
        type: "announcement",
        title: bulkNotifyTitle.trim(),
        body: bulkNotifyBody.trim(),
      }));
      // Use supabase insert (admin has RLS access via service role through edge function)
      // Actually we need to use the broadcast function approach, but for targeted users
      // we'll insert directly since platform_admin can't insert notifications for other users via client
      // So use the manage-user function with a notify action
      // Simpler: use broadcast function with specific user IDs - but that doesn't exist
      // Best approach: insert via admin-manage-user with a bulk_notify action
      const res = await supabase.functions.invoke("admin-manage-user", {
        body: { action: "bulk_notify", user_ids: Array.from(selectedIds), title: bulkNotifyTitle.trim(), body: bulkNotifyBody.trim() },
      });
      if (res.error || res.data?.error) throw new Error(res.data?.error || res.error?.message);
      toast.success(`Notification sent to ${selectedIds.size} user(s)`);
      setSelectedIds(new Set());
      setBulkAction(null);
      setBulkNotifyTitle("");
      setBulkNotifyBody("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send notifications");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkDeactivate = async () => {
    setBulkProcessing(true);
    try {
      let success = 0;
      for (const userId of selectedIds) {
        const res = await supabase.functions.invoke("admin-manage-user", {
          body: { action: "toggle_status", user_id: userId, status: "inactive" },
        });
        if (!res.error && !res.data?.error) success++;
      }
      toast.success(`${success} account(s) suspended`);
      setSelectedIds(new Set());
      setBulkAction(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate users");
    } finally {
      setBulkProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="platform_admin">Platform Admin</SelectItem>
            <SelectItem value="moderator">Moderator</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create User
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const emails = users.map(u => u.email).filter(Boolean).join("\n");
            const blob = new Blob([emails], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `user-emails-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success(`Exported ${users.filter(u => u.email).length} emails`);
          }}
          disabled={users.length === 0}
        >
          <Download className="h-4 w-4 mr-1" /> Export Emails
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {users.length === 0 ? "No users found" : "No users match your filters"}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div key={user.id} className="flex items-start gap-2">
              <Checkbox
                className="mt-3"
                checked={selectedIds.has(user.user_id)}
                onCheckedChange={() => toggleSelect(user.user_id)}
              />
              <div className="flex-1">
                <MobileRecordCard
                  title={displayName(user)}
                  subtitle={user.email || ""}
                  badge={{ label: user.status || "active", className: statusColors[user.status || "active"] || "" }}
                  fields={[
                    { label: "Role", value: user.role || "user" },
                    { label: "Created", value: new Date(user.created_at).toLocaleDateString() },
                  ]}
                  onClick={() => setSelected(user)}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Email</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Role</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Created</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className={`border-b last:border-0 transition-colors ${selectedIds.has(user.user_id) ? "bg-primary/5" : "hover:bg-muted/30"}`}>
                      <td className="p-3">
                        <Checkbox checked={selectedIds.has(user.user_id)} onCheckedChange={() => toggleSelect(user.user_id)} />
                      </td>
                      <td className="p-3 text-sm font-medium">{displayName(user)}</td>
                      <td className="p-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`capitalize ${roleColors[user.role || "user"] || ""}`}>
                          {(user.role || "user").replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`capitalize ${statusColors[user.status || "active"] || ""}`}>
                          {user.status || "active"}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(user)} title="Manage user">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleActAsUser(user)} title="Act as this user">
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center gap-2 bg-card border border-border shadow-xl rounded-xl px-4 py-3">
              <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
              <Button size="sm" variant="outline" onClick={() => setBulkAction("role")}>
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Assign Role
              </Button>
              <Button size="sm" variant="outline" onClick={() => setBulkAction("notify")}>
                <Bell className="h-3.5 w-3.5 mr-1" /> Notify
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setBulkAction("deactivate")}>
                <Ban className="h-3.5 w-3.5 mr-1" /> Suspend
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Role Dialog */}
      <Dialog open={bulkAction === "role"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Role to {selectedIds.size} User(s)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">New Role</Label>
              <Select value={bulkRole} onValueChange={setBulkRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                  <SelectItem value="platform_admin">Platform Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleBulkRoleChange} disabled={bulkProcessing}>
              {bulkProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : `Apply to ${selectedIds.size} user(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Notify Dialog */}
      <Dialog open={bulkAction === "notify"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Notification to {selectedIds.size} User(s)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Title</Label>
              <Input value={bulkNotifyTitle} onChange={e => setBulkNotifyTitle(e.target.value)} placeholder="Notification title" maxLength={100} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Message</Label>
              <Textarea value={bulkNotifyBody} onChange={e => setBulkNotifyBody(e.target.value)} placeholder="Write your message..." rows={3} maxLength={500} />
            </div>
            <Button className="w-full" onClick={handleBulkNotify} disabled={bulkProcessing || !bulkNotifyTitle.trim() || !bulkNotifyBody.trim()}>
              {bulkProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</> : `Send to ${selectedIds.size} user(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Deactivate Dialog */}
      <Dialog open={bulkAction === "deactivate"} onOpenChange={() => setBulkAction(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Suspend {selectedIds.size} Account(s)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will suspend {selectedIds.size} account(s). Suspended users will not be able to log in until reactivated.
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {selectedUsers.map(u => (
                <p key={u.user_id} className="text-xs text-muted-foreground">• {displayName(u)} ({u.email})</p>
              ))}
            </div>
            <Button variant="destructive" className="w-full" onClick={handleBulkDeactivate} disabled={bulkProcessing}>
              {bulkProcessing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : `Suspend ${selectedIds.size} account(s)`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchUsers} />
      <UserDetailsDialog user={selected} onClose={() => setSelected(null)} onActAs={handleActAsUser} onRefresh={handleRefresh} />
    </div>
  );
}
