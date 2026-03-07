import { useState } from "react";
import { adminUsers } from "@/lib/admin-mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Ban, KeyRound, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { OverflowActions } from "@/components/ui/overflow-actions";
import { toast } from "sonner";
import type { AdminUser } from "@/lib/admin-mock-data";

const roleColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  admin: "bg-accent text-accent-foreground",
  accountant: "bg-secondary text-secondary-foreground",
  staff: "bg-muted text-muted-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  disabled: "bg-destructive/10 text-destructive",
  pending: "bg-accent text-accent-foreground",
};

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const isMobile = useIsMobile();

  const filtered = adminUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.organization.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getUserActions = (user: AdminUser) => [
    { label: "View Details", icon: <Eye className="h-3.5 w-3.5" />, onClick: () => setSelected(user) },
    { label: user.status === "disabled" ? "Enable" : "Disable", icon: <Ban className="h-3.5 w-3.5" />, onClick: () => toast.info(`${user.name} ${user.status === 'disabled' ? 'enabled' : 'disabled'}`) },
    { label: "Reset Password", icon: <KeyRound className="h-3.5 w-3.5" />, onClick: () => toast.success(`Password reset email sent to ${user.email}`) },
    { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => toast.error(`${user.name} deleted`), destructive: true },
  ];

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
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="accountant">Accountant</SelectItem>
            <SelectItem value="staff">Staff</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMobile ? (
        <div className="space-y-2">
          {filtered.map((user) => (
            <MobileRecordCard
              key={user.id}
              title={user.name}
              subtitle={user.email}
              badge={{ label: user.status, className: statusColors[user.status] }}
              fields={[
                { label: "Organization", value: user.organization },
                { label: "Role", value: user.role },
                { label: "Last Login", value: user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : "Never" },
                { label: "Created", value: user.createdAt },
              ]}
              onClick={() => setSelected(user)}
              actions={<OverflowActions actions={getUserActions(user)} />}
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">Organization</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Role</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Last Login</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Created</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium">{user.name}</td>
                      <td className="p-3 text-sm text-muted-foreground">{user.email}</td>
                      <td className="p-3 text-sm">{user.organization}</td>
                      <td className="p-3"><Badge variant="secondary" className={`capitalize ${roleColors[user.role]}`}>{user.role}</Badge></td>
                      <td className="p-3"><Badge variant="secondary" className={`capitalize ${statusColors[user.status]}`}>{user.status}</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '—'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{user.createdAt}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(user)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info(`${user.name} ${user.status === 'disabled' ? 'enabled' : 'disabled'}`)}><Ban className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.success(`Password reset email sent to ${user.email}`)}><KeyRound className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => toast.error(`${user.name} deleted`)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>User Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-4">
              {[
                { l: "Name", v: selected.name },
                { l: "Email", v: selected.email },
                { l: "Organization", v: selected.organization },
                { l: "Role", v: selected.role },
                { l: "Status", v: selected.status },
                { l: "Last Login", v: selected.lastLogin ? new Date(selected.lastLogin).toLocaleString() : 'Never' },
                { l: "Created", v: selected.createdAt },
              ].map((f) => (
                <div key={f.l}>
                  <p className="text-xs text-muted-foreground">{f.l}</p>
                  <p className="text-sm font-medium capitalize">{f.v}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
