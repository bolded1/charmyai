import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Eye, Loader2, RefreshCw, UserCheck, Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useNavigate } from "react-router-dom";

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

function CreateUserDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", job_title: "", role: "user", company_name: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("admin-create-user", {
        body: form,
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to create user");
      }
      toast.success("User account created successfully");
      setForm({ email: "", password: "", first_name: "", last_name: "", job_title: "", role: "user" });
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create User Account</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="John" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Smith" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Password *</Label>
            <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Job Title</Label>
            <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="e.g. Finance Manager" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="platform_admin">Platform Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const isMobile = useIsMobile();
  const { startImpersonating } = useImpersonation();
  const navigate = useNavigate();

  const handleActAsUser = (user: UserRow) => {
    const name = displayName(user);
    startImpersonating({
      userId: user.user_id,
      email: user.email || "Unknown",
      displayName: name,
    });
    toast.success(`Now viewing as ${name}`);
    navigate("/app");
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      const roleMap = new Map<string, string>();
      (roles || []).forEach((r) => roleMap.set(r.user_id, r.role));

      const enriched = (profiles || []).map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) || "user",
      }));

      setUsers(enriched);
    } catch (err: any) {
      toast.error("Failed to load users: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const filtered = users.filter((u) => {
    const name = u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "";
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const displayName = (u: UserRow) => u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown";

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
            <MobileRecordCard
              key={user.id}
              title={displayName(user)}
              subtitle={user.email || ""}
              badge={{ label: user.status || "active", className: statusColors[user.status || "active"] || "" }}
              fields={[
                { label: "Role", value: user.role || "user" },
                { label: "Created", value: new Date(user.created_at).toLocaleDateString() },
              ]}
              onClick={() => setSelected(user)}
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
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
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
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(user)} title="View details">
                            <Eye className="h-3.5 w-3.5" />
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

      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={fetchUsers} />

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { l: "Name", v: displayName(selected) },
                  { l: "Email", v: selected.email || "—" },
                  { l: "Role", v: (selected.role || "user").replace("_", " ") },
                  { l: "Status", v: selected.status || "active" },
                  { l: "Created", v: new Date(selected.created_at).toLocaleString() },
                ].map((f) => (
                  <div key={f.l}>
                    <p className="text-xs text-muted-foreground">{f.l}</p>
                    <p className="text-sm font-medium capitalize">{f.v}</p>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => { setSelected(null); handleActAsUser(selected); }}
              >
                <UserCheck className="h-3.5 w-3.5 mr-2" /> Act as this user
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}