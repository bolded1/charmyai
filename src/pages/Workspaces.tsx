import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Building2, Briefcase, Plus, Trash2, Pencil, FileText, Receipt,
  ArrowRight, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function WorkspacesPage() {
  const {
    activeWorkspace, allWorkspaces, isAccountingFirm, clientWorkspaces,
    switchWorkspace, createClientWorkspace, deleteClientWorkspace, updateClientWorkspace,
  } = useWorkspace();

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const homeOrg = allWorkspaces.find(
    (w) => w.workspace_type === "accounting_firm" || w.workspace_type === "standard"
  );
  const maxWorkspaces = homeOrg?.max_client_workspaces || 10;

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
        <Button variant="default" className="mt-4">
          Upgrade to Firm Plan
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Client Workspaces</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage separate environments for each of your clients.
            {" "}
            <span className="font-medium">{clientWorkspaces.length}/{maxWorkspaces}</span> workspaces used.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          disabled={clientWorkspaces.length >= maxWorkspaces}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Client
        </Button>
      </div>

      {/* Firm workspace card */}
      <Card className={`border-2 transition-colors ${activeWorkspace?.id === homeOrg?.id ? "border-primary/50 bg-primary/5" : "border-border"}`}>
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate">{homeOrg?.name}</p>
                <Badge variant="secondary" className="text-[10px] shrink-0">Firm</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Your accounting firm workspace</p>
            </div>
          </div>
          {activeWorkspace?.id !== homeOrg?.id && (
            <Button variant="outline" size="sm" onClick={() => homeOrg && switchWorkspace(homeOrg.id)}>
              <ArrowRight className="h-3.5 w-3.5 mr-1" />
              Switch
            </Button>
          )}
          {activeWorkspace?.id === homeOrg?.id && (
            <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Active</Badge>
          )}
        </CardContent>
      </Card>

      {/* Client workspace cards */}
      <div className="space-y-3">
        <AnimatePresence>
          {clientWorkspaces.map((ws) => (
            <motion.div
              key={ws.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <Card className={`border transition-colors ${activeWorkspace?.id === ws.id ? "border-primary/50 bg-primary/5" : "border-border hover:border-border/80"}`}>
                <CardContent className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Briefcase className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold truncate">{ws.name}</p>
                        {activeWorkspace?.id === ws.id && (
                          <Badge className="bg-primary/10 text-primary border-0 text-[10px]">Active</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(ws.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {activeWorkspace?.id !== ws.id && (
                      <Button variant="outline" size="sm" onClick={() => switchWorkspace(ws.id)}>
                        <ArrowRight className="h-3.5 w-3.5 mr-1" />
                        Switch
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { setEditingId(ws.id); setEditName(ws.name); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingId(ws.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {clientWorkspaces.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-3">
              <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No client workspaces yet</p>
              <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Create your first client workspace
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
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

      {/* Edit Dialog */}
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

      {/* Delete Confirmation */}
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
