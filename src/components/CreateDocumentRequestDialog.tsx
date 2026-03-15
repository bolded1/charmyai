import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Loader2, Link2 } from "lucide-react";
import { useCreateDocumentRequest, DocumentRequest } from "@/hooks/useDocumentRequests";
import type { Workspace } from "@/contexts/WorkspaceContext";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  description: z.string().max(500).optional(),
  workspace_id: z.string().min(1, "Please select a client workspace"),
  expires_at: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  firmOrgId: string;
  clientWorkspaces: Workspace[];
}

export function CreateDocumentRequestDialog({ open, onOpenChange, firmOrgId, clientWorkspaces }: Props) {
  const createRequest = useCreateDocumentRequest();
  const [created, setCreated] = useState<DocumentRequest | null>(null);
  const [copied, setCopied] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const workspaceId = watch("workspace_id");

  const uploadUrl = created
    ? `${window.location.origin}/request/${created.token}`
    : null;

  const copyLink = () => {
    if (!uploadUrl) return;
    navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (values: FormData) => {
    const result = await createRequest.mutateAsync({
      firm_org_id: firmOrgId,
      workspace_id: values.workspace_id,
      title: values.title,
      description: values.description || undefined,
      expires_at: values.expires_at || undefined,
    });
    setCreated(result);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCreated(null);
      setCopied(false);
      reset();
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>New document request</DialogTitle>
              <DialogDescription>
                Generate a shareable link your client can use to upload documents directly into their workspace.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="dr-title">Title</Label>
                <Input
                  id="dr-title"
                  placeholder="Q1 2024 Expense Receipts"
                  {...register("title")}
                />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dr-description">Instructions (optional)</Label>
                <Textarea
                  id="dr-description"
                  placeholder="Please upload all receipts and invoices from January–March 2024."
                  rows={3}
                  className="resize-none text-sm"
                  {...register("description")}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Client workspace</Label>
                <Select
                  value={workspaceId}
                  onValueChange={(v) => setValue("workspace_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client workspace…" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientWorkspaces.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id}>
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.workspace_id && (
                  <p className="text-xs text-destructive">{errors.workspace_id.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dr-expires">Deadline (optional)</Label>
                <Input
                  id="dr-expires"
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  {...register("expires_at")}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button type="button" variant="ghost" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRequest.isPending}>
                  {createRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create request
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Request created</DialogTitle>
              <DialogDescription>
                Share this link with your client. Anyone with the link can upload files.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm flex-1 truncate text-foreground font-mono">{uploadUrl}</span>
                <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0 h-7">
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Documents uploaded via this link will appear in the selected workspace with{" "}
                <span className="font-medium">needs review</span> status.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button onClick={copyLink} variant="outline">
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                {copied ? "Copied!" : "Copy link"}
              </Button>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
