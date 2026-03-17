import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, Trash2, Send, Copy, Check, ChevronDown, ChevronRight,
  Loader2, Link2, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ─── Event definitions ────────────────────────────────────────────────────────

const WEBHOOK_EVENTS = [
  {
    value: "document.uploaded",
    label: "Document Uploaded",
    desc: "Fired when a new document is uploaded via the API or UI",
  },
  {
    value: "document.extracted",
    label: "Extraction Complete",
    desc: "Fired when AI finishes extracting data from a document",
  },
  {
    value: "document.approved",
    label: "Document Approved",
    desc: "Fired when a document is approved and an expense/income record is created",
  },
  {
    value: "document.updated",
    label: "Document Updated",
    desc: "Fired when document fields are manually edited",
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Endpoint = {
  id: string;
  target_url: string;
  events: string[];
  created_at: string;
  revoked_at: string | null;
};

type Delivery = {
  id: string;
  event_type: string;
  response_status: number | null;
  response_body: string | null;
  attempted_at: string;
};

// ─── API helpers ──────────────────────────────────────────────────────────────

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1`;

async function callApi(path: string, method: string, body?: object) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any).error ?? `Request failed (${res.status})`);
  return json;
}

// ─── Create dialog ────────────────────────────────────────────────────────────

function CreateWebhookDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (secret: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [allEvents, setAllEvents] = useState(false);
  const [selected, setSelected] = useState<string[]>(["document.approved"]);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (value: string) =>
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );

  const handleSubmit = async () => {
    if (!url.trim()) { toast.error("Enter a target URL"); return; }
    const events = allEvents ? ["*"] : selected;
    if (events.length === 0) { toast.error("Select at least one event"); return; }

    setSaving(true);
    try {
      const result = await callApi("webhooks", "POST", { target_url: url.trim(), events });
      onCreated(result.signing_secret);
      onOpenChange(false);
      setUrl("");
      setSelected(["document.approved"]);
      setAllEvents(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New Webhook Endpoint</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Target URL</Label>
            <Input
              placeholder="https://hooks.zapier.com/hooks/catch/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-sm font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              Works with Zapier, Make, n8n, or any public HTTPS endpoint.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Events</Label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={allEvents}
                onCheckedChange={(v) => setAllEvents(!!v)}
              />
              <span className="text-sm font-medium">All events</span>
            </label>
            {!allEvents && (
              <div className="space-y-2 pl-1">
                {WEBHOOK_EVENTS.map((ev) => (
                  <label key={ev.value} className="flex items-start gap-2 cursor-pointer select-none">
                    <Checkbox
                      checked={selected.includes(ev.value)}
                      onCheckedChange={() => toggleEvent(ev.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm">{ev.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-4">{ev.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Create Webhook
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Secret reveal dialog ─────────────────────────────────────────────────────

function SecretRevealDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Webhook Signing Secret</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Copy this secret now — it won't be shown again. Use it to verify the{" "}
            <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">X-Charmy-Signature</code>{" "}
            header on incoming requests.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded-md break-all">
              {secret}
            </code>
            <Button size="sm" variant="outline" onClick={copy} className="shrink-0">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
          </div>
          <div className="rounded-md bg-muted/50 border p-3 text-[11px] text-muted-foreground space-y-1">
            <p className="font-medium text-foreground text-xs">Verifying signatures</p>
            <p>Compute <code className="font-mono">HMAC-SHA256(secret, request_body)</code> and compare with the <code className="font-mono">X-Charmy-Signature</code> header (strip the <code className="font-mono">sha256=</code> prefix).</p>
          </div>
          <Button onClick={onClose} className="w-full">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Delivery history row ─────────────────────────────────────────────────────

function DeliveryRow({ delivery }: { delivery: Delivery }) {
  const ok = delivery.response_status && delivery.response_status >= 200 && delivery.response_status < 300;
  return (
    <div className="flex items-center gap-3 text-xs py-1.5 border-b last:border-0">
      <Badge
        variant={ok ? "success" : "destructive"}
        className="text-[10px] h-5 shrink-0"
      >
        {delivery.response_status ?? "ERR"}
      </Badge>
      <span className="font-mono text-muted-foreground shrink-0">{delivery.event_type}</span>
      <span className="flex-1 truncate text-muted-foreground">
        {delivery.response_body?.slice(0, 80) || "—"}
      </span>
      <span className="text-muted-foreground shrink-0">
        {formatDistanceToNow(new Date(delivery.attempted_at), { addSuffix: true })}
      </span>
    </div>
  );
}

// ─── Endpoint row ─────────────────────────────────────────────────────────────

function EndpointRow({
  endpoint,
  onDelete,
  onTest,
  testingId,
}: {
  endpoint: Endpoint;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  testingId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [deliveries, setDeliveries] = useState<Delivery[] | null>(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const loadDeliveries = useCallback(async () => {
    if (deliveries !== null) return;
    setLoadingDeliveries(true);
    try {
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("id, event_type, response_status, response_body, attempted_at")
        .eq("webhook_endpoint_id", endpoint.id)
        .order("attempted_at", { ascending: false })
        .limit(5);
      if (!error) setDeliveries(data ?? []);
    } finally {
      setLoadingDeliveries(false);
    }
  }, [endpoint.id, deliveries]);

  const handleExpand = () => {
    setExpanded((v) => !v);
    if (!expanded) loadDeliveries();
  };

  const handleTest = () => {
    // Reload deliveries after test
    onTest(endpoint.id);
    setDeliveries(null); // force reload
  };

  const isActive = !endpoint.revoked_at;
  const eventLabels =
    endpoint.events.includes("*")
      ? ["All events"]
      : endpoint.events.map(
          (ev) => WEBHOOK_EVENTS.find((e) => e.value === ev)?.label ?? ev
        );

  return (
    <div className={cn("rounded-lg border", !isActive && "opacity-50")}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={handleExpand}
        >
          {expanded
            ? <ChevronDown className="h-4 w-4" />
            : <ChevronRight className="h-4 w-4" />}
        </button>

        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono truncate">{endpoint.target_url}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {eventLabels.map((label) => (
              <Badge key={label} variant="secondary" className="text-[10px] h-4 px-1.5">
                {label}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge variant={isActive ? "success" : "outline"} className="text-[10px]">
            {isActive ? "Active" : "Revoked"}
          </Badge>

          {isActive && (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                disabled={testingId === endpoint.id}
                onClick={handleTest}
                title="Send test event"
              >
                {testingId === endpoint.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Send className="h-3.5 w-3.5" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-destructive hover:text-destructive"
                onClick={() => onDelete(endpoint.id)}
                title="Remove webhook"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Expanded: delivery history */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-1 bg-muted/20">
          <p className="text-[11px] font-medium text-muted-foreground mb-2">
            Recent deliveries
            <span className="ml-1 text-[10px]">(last 5)</span>
          </p>

          {loadingDeliveries && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loadingDeliveries && deliveries?.length === 0 && (
            <p className="text-xs text-muted-foreground py-2">
              No deliveries yet. Click the send button to test this endpoint.
            </p>
          )}

          {!loadingDeliveries &&
            deliveries?.map((d) => <DeliveryRow key={d.id} delivery={d} />)}

          <p className="text-[11px] text-muted-foreground pt-1">
            Created {format(new Date(endpoint.created_at), "MMM d, yyyy")}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WebhookManager() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [revealSecret, setRevealSecret] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("webhook_endpoints")
        .select("id, target_url, events, created_at, revoked_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEndpoints((data ?? []).map(d => ({ ...d, events: Array.isArray(d.events) ? d.events as string[] : [] })));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (secret: string) => {
    setRevealSecret(secret);
    load();
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await callApi(`webhooks/${id}/test`, "POST");
      toast.success("Test event sent");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await supabase
        .from("webhook_endpoints")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", deleteId);
      setEndpoints((prev) =>
        prev.map((e) =>
          e.id === deleteId ? { ...e, revoked_at: new Date().toISOString() } : e
        )
      );
      toast.success("Webhook endpoint removed");
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const active = endpoints.filter((e) => !e.revoked_at);
  const revoked = endpoints.filter((e) => !!e.revoked_at);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Webhooks</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send live events to Zapier, Make, Google Sheets, or any HTTPS endpoint.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Endpoint
        </Button>
      </div>

      {/* Supported events guide */}
      <div className="rounded-lg border border-dashed p-3 grid sm:grid-cols-2 gap-2">
        {WEBHOOK_EVENTS.map((ev) => (
          <div key={ev.value} className="flex items-start gap-2">
            <Zap className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium">{ev.label}</p>
              <p className="text-[11px] text-muted-foreground leading-4">{ev.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Endpoint list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : active.length === 0 && revoked.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No webhook endpoints yet.</p>
          <p className="text-xs mt-1">Add an endpoint to start receiving events.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map((ep) => (
            <EndpointRow
              key={ep.id}
              endpoint={ep}
              onDelete={setDeleteId}
              onTest={handleTest}
              testingId={testingId}
            />
          ))}
          {revoked.length > 0 && (
            <>
              <p className="text-xs text-muted-foreground pt-2">Revoked</p>
              {revoked.map((ep) => (
                <EndpointRow
                  key={ep.id}
                  endpoint={ep}
                  onDelete={setDeleteId}
                  onTest={handleTest}
                  testingId={testingId}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Dialogs */}
      <CreateWebhookDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      {revealSecret && (
        <SecretRevealDialog secret={revealSecret} onClose={() => setRevealSecret(null)} />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove webhook endpoint?</AlertDialogTitle>
            <AlertDialogDescription>
              This endpoint will stop receiving events immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
