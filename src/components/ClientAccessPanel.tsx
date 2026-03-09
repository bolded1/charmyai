import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserPlus, Mail, RefreshCw, ShieldOff, ShieldCheck, Loader2,
  Clock, CheckCircle2, XCircle, User, Send,
} from "lucide-react";
import {
  useClientInvitations, useSendClientInvitation, useResendClientInvitation,
  useRevokeClientInvitation, useReinstateClientInvitation,
  type ClientInvitation,
} from "@/hooks/useClientInvitations";
import { formatDistanceToNow } from "date-fns";

interface ClientAccessPanelProps {
  workspaceId: string;
  workspaceName: string;
  contactName?: string | null;
  contactEmail?: string | null;
}

export function ClientAccessPanel({ workspaceId, workspaceName, contactName, contactEmail }: ClientAccessPanelProps) {
  const { data: invitations = [], isLoading } = useClientInvitations(workspaceId);
  const sendInvitation = useSendClientInvitation();
  const resendInvitation = useResendClientInvitation();
  const revokeInvitation = useRevokeClientInvitation();
  const reinstateInvitation = useReinstateClientInvitation();

  const [inviteMode, setInviteMode] = useState(false);
  const [clientName, setClientName] = useState(contactName || "");
  const [clientEmail, setClientEmail] = useState(contactEmail || "");
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const currentInvitation = invitations[0] as ClientInvitation | undefined;

  const handleSendInvite = async () => {
    if (!clientName.trim() || !clientEmail.trim()) return;
    await sendInvitation.mutateAsync({
      workspace_id: workspaceId,
      client_name: clientName.trim(),
      client_email: clientEmail.trim(),
    });
    setInviteMode(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary" className="text-[10px] gap-1"><Clock className="h-3 w-3" /> Invited</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
      case "revoked":
        return <Badge variant="destructive" className="text-[10px] gap-1"><XCircle className="h-3 w-3" /> Revoked</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 flex items-center justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Client Access</h3>
            </div>
            {!currentInvitation && !inviteMode && (
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setInviteMode(true)}>
                <Send className="h-3 w-3 mr-1" /> Invite Client
              </Button>
            )}
          </div>

          {/* No invitation yet */}
          {!currentInvitation && !inviteMode && (
            <div className="bg-accent/50 rounded-lg p-4 text-center space-y-2">
              <User className="h-8 w-8 mx-auto text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                No client has been invited to this workspace. This is an internal-only workspace managed by your firm.
              </p>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setInviteMode(true)}>
                <UserPlus className="h-3 w-3 mr-1" /> Invite a client
              </Button>
            </div>
          )}

          {/* Invite form */}
          {inviteMode && !currentInvitation && (
            <div className="space-y-3 bg-accent/30 rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Invite the client to access their workspace. They'll receive an email with a link to set up their account.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Contact Name</Label>
                  <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Doe" className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Contact Email</Label>
                  <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@company.com" className="h-9 text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setInviteMode(false)}>Cancel</Button>
                <Button size="sm" className="h-7 text-xs" onClick={handleSendInvite} disabled={!clientName.trim() || !clientEmail.trim() || sendInvitation.isPending}>
                  {sendInvitation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                  <Mail className="h-3 w-3 mr-1" /> Send Invitation
                </Button>
              </div>
            </div>
          )}

          {/* Existing invitation */}
          {currentInvitation && (
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{currentInvitation.client_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{currentInvitation.client_email}</p>
                  </div>
                </div>
                {statusBadge(currentInvitation.status)}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium text-foreground">Client</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Invited</p>
                  <p className="font-medium text-foreground">
                    {formatDistanceToNow(new Date(currentInvitation.created_at), { addSuffix: true })}
                  </p>
                </div>
                {currentInvitation.status === "pending" && (
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(currentInvitation.expires_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
                {currentInvitation.accepted_at && (
                  <div>
                    <p className="text-muted-foreground">Accepted</p>
                    <p className="font-medium text-foreground">
                      {formatDistanceToNow(new Date(currentInvitation.accepted_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {currentInvitation.status === "pending" && (
                  <>
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => resendInvitation.mutate(currentInvitation.id)} disabled={resendInvitation.isPending}>
                      {resendInvitation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                      Resend
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setRevokeId(currentInvitation.id)}>
                      <ShieldOff className="h-3 w-3 mr-1" /> Revoke
                    </Button>
                  </>
                )}
                {currentInvitation.status === "accepted" && (
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setRevokeId(currentInvitation.id)}>
                    <ShieldOff className="h-3 w-3 mr-1" /> Revoke Access
                  </Button>
                )}
                {currentInvitation.status === "revoked" && (
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => reinstateInvitation.mutate(currentInvitation.id)} disabled={reinstateInvitation.isPending}>
                    {reinstateInvitation.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ShieldCheck className="h-3 w-3 mr-1" />}
                    Re-enable Access
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeId} onOpenChange={() => setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-destructive" />
              Revoke Client Access
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke the client's access to "{workspaceName}". They will no longer be able to log in and view documents. You can re-enable access later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (revokeId) revokeInvitation.mutate(revokeId); }}
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
