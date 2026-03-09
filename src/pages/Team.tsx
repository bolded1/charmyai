import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2, MoreHorizontal, Shield, UserCog, Pencil, Trash2, UserX, UserCheck, Briefcase } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  useTeamMembers, useInviteTeamMember, useUpdateTeamMember,
  useRemoveTeamMember, useToggleTeamMemberStatus, TeamMember,
} from "@/hooks/useTeamMembers";

const ROLE_LABELS: Record<string, string> = {
  firm_owner: "Firm Owner",
  firm_admin: "Firm Admin",
  accountant: "Accountant",
  staff: "Staff",
};

const ROLE_COLORS: Record<string, string> = {
  firm_owner: "bg-primary/10 text-primary border-primary/20",
  firm_admin: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  accountant: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  staff: "bg-muted text-muted-foreground",
};

function getInitials(member: TeamMember) {
  if (member.profile?.full_name) {
    return member.profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  if (member.profile?.first_name) {
    return (member.profile.first_name[0] + (member.profile.last_name?.[0] || "")).toUpperCase();
  }
  return member.email.slice(0, 2).toUpperCase();
}

function getDisplayName(member: TeamMember) {
  if (member.profile?.full_name) return member.profile.full_name;
  if (member.profile?.first_name) return `${member.profile.first_name} ${member.profile.last_name || ""}`.trim();
  return member.email.split("@")[0];
}

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editMember, setEditMember] = useState<TeamMember | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { isAccountingFirm, clientWorkspaces } = useWorkspace();

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("accountant");
  const [inviteWsIds, setInviteWsIds] = useState<string[]>([]);

  // Edit form state
  const [editRole, setEditRole] = useState("");
  const [editWsIds, setEditWsIds] = useState<string[]>([]);

  const { data: members = [], isLoading } = useTeamMembers();
  const inviteMember = useInviteTeamMember();
  const updateMember = useUpdateTeamMember();
  const removeMember = useRemoveTeamMember();
  const toggleStatus = useToggleTeamMemberStatus();

  if (!isAccountingFirm) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-sm">Team management is available for accounting firm accounts.</p>
      </div>
    );
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteMember.mutateAsync({
      email: inviteEmail,
      role: inviteRole,
      workspace_ids: inviteWsIds,
    });
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("accountant");
    setInviteWsIds([]);
  };

  const openEdit = (member: TeamMember) => {
    setEditMember(member);
    setEditRole(member.role);
    setEditWsIds(member.workspace_ids || []);
  };

  const handleSaveEdit = async () => {
    if (!editMember) return;
    await updateMember.mutateAsync({
      member_id: editMember.id,
      role: editRole,
      workspace_ids: editWsIds,
    });
    setEditMember(null);
  };

  const handleRemove = async () => {
    if (!removeMemberId) return;
    await removeMember.mutateAsync(removeMemberId);
    setRemoveMemberId(null);
  };

  const toggleWs = (wsId: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(wsId) ? list.filter((id) => id !== wsId) : [...list, wsId]);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success" className="text-xs font-normal">Active</Badge>;
      case "invited":
        return <Badge variant="outline" className="text-xs font-normal">Invited</Badge>;
      case "suspended":
        return <Badge variant="destructive" className="text-xs font-normal">Suspended</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs font-normal">{status}</Badge>;
    }
  };

  const workspaceNames = (wsIds: string[]) => {
    if (wsIds.length === 0) return "None assigned";
    return wsIds
      .map((id) => clientWorkspaces.find((w) => w.id === id)?.name || "Unknown")
      .join(", ");
  };

  const WorkspaceSelector = ({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) => (
    <div className="space-y-2 max-h-40 overflow-y-auto">
      {clientWorkspaces.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">No client workspaces created yet.</p>
      ) : (
        clientWorkspaces.map((ws) => (
          <label key={ws.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent cursor-pointer">
            <Checkbox
              checked={selected.includes(ws.id)}
              onCheckedChange={() => toggleWs(ws.id, selected, onChange)}
            />
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">{ws.name}</span>
          </label>
        ))
      )}
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="firm_admin">Firm Admin — Full access to all workspaces</SelectItem>
                    <SelectItem value="accountant">Accountant — Access assigned workspaces</SelectItem>
                    <SelectItem value="staff">Staff — Limited access to assigned workspaces</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(inviteRole === "accountant" || inviteRole === "staff") && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Assign Workspaces</Label>
                  <WorkspaceSelector selected={inviteWsIds} onChange={setInviteWsIds} />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={inviteMember.isPending}>
                {inviteMember.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Send Invitation
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserCog className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No team members yet. Invite your first team member to get started.</p>
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {members.map((member) => (
            <MobileRecordCard
              key={member.id}
              title={getDisplayName(member)}
              subtitle={member.email}
              badge={{
                label: ROLE_LABELS[member.role] || member.role,
                className: ROLE_COLORS[member.role] || "",
              }}
              fields={[
                { label: "Status", value: member.status },
                { label: "Workspaces", value: workspaceNames(member.workspace_ids) },
                { label: "Joined", value: member.accepted_at ? new Date(member.accepted_at).toLocaleDateString() : "Pending" },
              ]}
              onClick={() => openEdit(member)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Member</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Role</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Workspaces</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b border-border-subtle last:border-0 hover:bg-accent/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {member.profile?.avatar_url && <AvatarImage src={member.profile.avatar_url} />}
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{getDisplayName(member)}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className={`text-xs font-normal ${ROLE_COLORS[member.role] || ""}`}>
                        {ROLE_LABELS[member.role] || member.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {member.role === "firm_owner" || member.role === "firm_admin" ? (
                        <span className="text-xs text-muted-foreground">All workspaces</span>
                      ) : member.workspace_ids.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.workspace_ids.slice(0, 3).map((wsId) => {
                            const ws = clientWorkspaces.find((w) => w.id === wsId);
                            return (
                              <Badge key={wsId} variant="secondary" className="text-[10px]">
                                {ws?.name || "Unknown"}
                              </Badge>
                            );
                          })}
                          {member.workspace_ids.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{member.workspace_ids.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="p-4">{statusBadge(member.status)}</td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(member)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Access
                          </DropdownMenuItem>
                          {member.status === "active" ? (
                            <DropdownMenuItem onClick={() => toggleStatus.mutate({ member_id: member.id, suspend: true })}>
                              <UserX className="h-3.5 w-3.5 mr-2" /> Suspend
                            </DropdownMenuItem>
                          ) : member.status === "suspended" ? (
                            <DropdownMenuItem onClick={() => toggleStatus.mutate({ member_id: member.id, suspend: false })}>
                              <UserCheck className="h-3.5 w-3.5 mr-2" /> Activate
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setRemoveMemberId(member.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={!!editMember} onOpenChange={(v) => !v && setEditMember(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {editMember && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Avatar className="h-10 w-10">
                  {editMember.profile?.avatar_url && <AvatarImage src={editMember.profile.avatar_url} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(editMember)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{getDisplayName(editMember)}</p>
                  <p className="text-xs text-muted-foreground">{editMember.email}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Select value={editRole} onValueChange={setEditRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="firm_admin">Firm Admin</SelectItem>
                    <SelectItem value="accountant">Accountant</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(editRole === "accountant" || editRole === "staff") && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Assigned Workspaces</Label>
                  <WorkspaceSelector selected={editWsIds} onChange={setEditWsIds} />
                </div>
              )}

              <Button onClick={handleSaveEdit} className="w-full" disabled={updateMember.isPending}>
                {updateMember.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeMemberId} onOpenChange={(v) => !v && setRemoveMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke their access to all workspaces. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
