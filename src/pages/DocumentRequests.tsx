import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Link2, Copy, Check, MoreHorizontal, XCircle, RefreshCw,
  Upload, CalendarClock, Building2, Loader2, FileText,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useDocumentRequests, useCloseDocumentRequest, DocumentRequest } from "@/hooks/useDocumentRequests";
import { CreateDocumentRequestDialog } from "@/components/CreateDocumentRequestDialog";
import { cn } from "@/lib/utils";

function getUploadUrl(token: string) {
  return `${window.location.origin}/request/${token}`;
}

function RequestCard({
  req,
  workspaceName,
  onClose,
  onReopen,
}: {
  req: DocumentRequest;
  workspaceName: string;
  onClose: (id: string) => void;
  onReopen: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = getUploadUrl(req.token);

  const isExpired = req.expires_at ? new Date(req.expires_at) < new Date() : false;
  const effectiveStatus = isExpired && req.status === "active" ? "expired" : req.status;

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground truncate">{req.title}</h3>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs shrink-0",
                  effectiveStatus === "active" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  effectiveStatus === "closed" && "bg-muted text-muted-foreground",
                  effectiveStatus === "expired" && "bg-amber-50 text-amber-700 border-amber-200"
                )}
              >
                {effectiveStatus}
              </Badge>
            </div>

            {req.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{req.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-0.5">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                {workspaceName}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Upload className="h-3 w-3" />
                {req.upload_count} {req.upload_count === 1 ? "file" : "files"} uploaded
              </span>
              {req.expires_at && (
                <span className={cn(
                  "flex items-center gap-1 text-xs",
                  isExpired ? "text-amber-600" : "text-muted-foreground"
                )}>
                  <CalendarClock className="h-3 w-3" />
                  {isExpired ? "Expired" : "Due"} {format(new Date(req.expires_at), "PP")}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                Created {format(new Date(req.created_at), "PP")}
              </span>
            </div>

            {/* Share link */}
            {effectiveStatus === "active" && (
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-2.5 py-1.5 mt-1">
                <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-foreground flex-1 truncate">{url}</span>
                <button
                  onClick={copyLink}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {effectiveStatus === "active" && (
                <DropdownMenuItem onClick={copyLink}>
                  <Copy className="h-4 w-4 mr-2" /> Copy link
                </DropdownMenuItem>
              )}
              {effectiveStatus === "active" && (
                <DropdownMenuItem
                  onClick={() => onClose(req.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" /> Close request
                </DropdownMenuItem>
              )}
              {(effectiveStatus === "closed") && (
                <DropdownMenuItem onClick={() => onReopen(req.id)}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Reopen request
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentRequestsPage() {
  const { homeOrg, clientWorkspaces, isAccountingFirm } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [closeTarget, setCloseTarget] = useState<string | null>(null);

  const firmOrgId = homeOrg?.id;
  const { data: requests = [], isLoading } = useDocumentRequests(firmOrgId);
  const closeRequest = useCloseDocumentRequest();

  // Build workspace name lookup
  const workspaceNameById: Record<string, string> = {};
  clientWorkspaces.forEach((ws) => { workspaceNameById[ws.id] = ws.name; });

  const handleClose = async () => {
    if (!closeTarget) return;
    await closeRequest.mutateAsync({ id: closeTarget });
    setCloseTarget(null);
  };

  const handleReopen = async (id: string) => {
    await closeRequest.mutateAsync({ id, reopen: true });
  };

  if (!isAccountingFirm) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 space-y-3 text-center px-4">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Not available</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Document requests are available for accounting firm accounts only.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Document Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Generate shareable upload links for your clients
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" /> New request
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center border border-dashed border-border rounded-xl">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Link2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No requests yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Create a request to generate a link your clients can use to upload documents directly.
            </p>
          </div>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Create first request
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              workspaceName={workspaceNameById[req.workspace_id] ?? "Unknown workspace"}
              onClose={setCloseTarget}
              onReopen={handleReopen}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      {firmOrgId && (
        <CreateDocumentRequestDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          firmOrgId={firmOrgId}
          clientWorkspaces={clientWorkspaces}
        />
      )}

      {/* Close confirmation */}
      <AlertDialog open={!!closeTarget} onOpenChange={(v) => !v && setCloseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close this request?</AlertDialogTitle>
            <AlertDialogDescription>
              The upload link will stop accepting new files. You can reopen it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={closeRequest.isPending}>
              {closeRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Close request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
