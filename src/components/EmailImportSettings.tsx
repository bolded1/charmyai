import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Mail, Copy, Check, Loader2, Inbox, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useOrganization, useCreateOrganization, useEmailImports, getImportEmailAddress } from "@/hooks/useOrganization";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

function getImportStatus(imp: any): { label: string; className: string; icon: React.ReactNode } {
  if (imp.attachment_count === 0 || imp.status === "ignored") {
    return { label: "Ignored", className: "bg-muted text-muted-foreground", icon: <AlertTriangle className="h-3 w-3" /> };
  }
  if (imp.status === "failed" || imp.processed_count === 0) {
    return { label: "Failed", className: "bg-destructive/10 text-destructive", icon: <XCircle className="h-3 w-3" /> };
  }
  if (imp.processed_count < imp.attachment_count) {
    return { label: "Partial", className: "bg-accent text-accent-foreground", icon: <AlertTriangle className="h-3 w-3" /> };
  }
  return { label: "Imported", className: "bg-primary/10 text-primary", icon: <CheckCircle2 className="h-3 w-3" /> };
}

export default function EmailImportSettings() {
  const { data: org, isLoading: orgLoading } = useOrganization();
  const { data: imports = [], isLoading: importsLoading } = useEmailImports();
  const createOrg = useCreateOrganization();
  const [copied, setCopied] = useState(false);
  const [orgName, setOrgName] = useState("");

  const importEmail = org ? getImportEmailAddress(org.import_email_token) : null;

  const handleCopy = async () => {
    if (!importEmail) return;
    await navigator.clipboard.writeText(importEmail);
    setCopied(true);
    toast.success("Import email copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateOrg = async () => {
    if (!orgName.trim()) {
      toast.error("Please enter an organization name.");
      return;
    }
    await createOrg.mutateAsync(orgName.trim());
  };

  if (orgLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No organization yet — prompt to create one
  if (!org) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <SectionHeader
              title="Set Up Email Import"
              description="Create an organization to get your unique import email address."
            />
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Organization Name</Label>
                <Input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <Button onClick={handleCreateOrg} disabled={createOrg.isPending}>
                {createOrg.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Import Email Address */}
      <Card>
        <CardContent className="p-6">
          <SectionHeader
            title="Email Import Address"
            description="Forward invoices and receipts to this email address. Attachments will be automatically imported and processed."
          />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 rounded-md border border-input bg-muted/40 px-3 py-2">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-mono truncate">{importEmail}</span>
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="rounded-lg bg-muted/40 border border-border p-4 space-y-2">
              <p className="text-xs font-medium text-foreground">How it works</p>
              <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Forward a supplier invoice or receipt to the email address above</li>
                <li>PDF, PNG, JPG and JPEG attachments are automatically extracted</li>
                <li>Each attachment creates a document record for review</li>
                <li>AI extraction runs automatically on supported files</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration */}
      <Card>
        <CardContent className="p-6">
          <SectionHeader title="Import Configuration" description="File types and size limits for email imports." />
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Allowed File Types</Label>
              <div className="flex gap-2 flex-wrap">
                {["PDF", "PNG", "JPG", "JPEG"].map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Max Attachment Size</Label>
              <p className="text-sm">20 MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Imports Table */}
      <Card>
        <CardContent className="p-0">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="text-sm font-medium">Recent Email Imports</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Emails received and processed recently.</p>
          </div>
          {importsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No emails received yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Forward an invoice to your import address to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground">Received</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Sender</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Subject</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground text-center">Attachments</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Result</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground text-center">Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {imports.map((imp: any) => {
                    const status = getImportStatus(imp);
                    return (
                      <tr key={imp.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(imp.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                          <span className="block text-[10px] text-muted-foreground/60">
                            {new Date(imp.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </td>
                        <td className="p-3 max-w-[160px]">
                          <p className="text-sm truncate">{imp.sender_name || imp.sender_email || "—"}</p>
                          {imp.sender_name && (
                            <p className="text-[10px] text-muted-foreground truncate">{imp.sender_email}</p>
                          )}
                        </td>
                        <td className="p-3 max-w-[200px]">
                          <p className="text-sm truncate">{imp.subject || "(no subject)"}</p>
                          {imp.error_message && (
                            <p className="text-[10px] text-destructive truncate mt-0.5">{imp.error_message}</p>
                          )}
                        </td>
                        <td className="p-3 text-center text-sm">{imp.attachment_count}</td>
                        <td className="p-3">
                          <Badge variant="secondary" className={`text-[10px] gap-1 ${status.className}`}>
                            {status.icon} {status.label}
                          </Badge>
                        </td>
                        <td className="p-3 text-center text-sm font-medium">
                          {imp.processed_count > 0 ? imp.processed_count : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
