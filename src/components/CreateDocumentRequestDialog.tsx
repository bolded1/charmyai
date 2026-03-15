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
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Copy, Check, Loader2, Link2, Mail, Send } from "lucide-react";
import { useCreateDocumentRequest, DocumentRequest } from "@/hooks/useDocumentRequests";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  workspaces: Workspace[];
}

export function CreateDocumentRequestDialog({ open, onOpenChange, firmOrgId, workspaces }: Props) {
  const createRequest = useCreateDocumentRequest();
  const [created, setCreated] = useState<DocumentRequest | null>(null);
  const [copied, setCopied] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const workspaceId = watch("workspace_id");

  // Find selected workspace's client contact email
  const selectedWorkspace = workspaces.find((ws) => ws.id === workspaceId);
  const clientEmail = (selectedWorkspace as any)?.client_contact_email as string | undefined;

  const uploadUrl = created
    ? `https://charmy.net/request/${created.token}`
    : null;

  const copyLink = () => {
    if (!uploadUrl) return;
    navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmailNotification = async (requestId: string) => {
    setEmailSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-document-request-email", {
        body: { request_id: requestId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setEmailSent(true);
      toast.success(`Email sent to ${data.sent_to}`);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to send email");
    } finally {
      setEmailSending(false);
    }
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

    // Auto-send email if toggled on and client email exists
    if (sendEmail && clientEmail) {
      await sendEmailNotification(result.id);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setCreated(null);
      setCopied(false);
      setSendEmail(true);
      setEmailSending(false);
      setEmailSent(false);
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
                <Label>Destination workspace</Label>
                <Select
                  value={workspaceId}
                  onValueChange={(v) => setValue("workspace_id", v, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client workspace…" />
                  </SelectTrigger>
                  <SelectContent>
                    {workspaces.map((ws) => (
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

              {/* Email notification toggle */}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Email to client</p>
                    {workspaceId && clientEmail ? (
                      <p className="text-xs text-muted-foreground">{clientEmail}</p>
                    ) : workspaceId && !clientEmail ? (
                      <p className="text-xs text-destructive">No contact email set for this workspace</p>
                    ) : (
                      <p className="text-xs text-muted-foreground">Select a workspace first</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={sendEmail && !!clientEmail}
                  onCheckedChange={setSendEmail}
                  disabled={!clientEmail}
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

              {/* Email status */}
              {emailSent && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <Check className="h-4 w-4" />
                  <span>Email sent to {clientEmail}</span>
                </div>
              )}
              {!emailSent && clientEmail && !emailSending && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => sendEmailNotification(created!.id)}
                  className="w-full"
                >
                  <Send className="h-3.5 w-3.5 mr-2" />
                  Send email to {clientEmail}
                </Button>
              )}
              {emailSending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sending email…</span>
                </div>
              )}

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
