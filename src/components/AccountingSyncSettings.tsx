import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Link2, Unlink, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useSearchParams } from "react-router-dom";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const OAUTH_FN = `${SUPABASE_URL}/functions/v1/accounting-oauth`;
const SYNC_FN = `${SUPABASE_URL}/functions/v1/accounting-sync`;

type Provider = "quickbooks" | "xero" | "freshbooks";

interface Integration {
  provider: Provider;
  realm_id: string | null;
  connected_at: string;
  last_sync_at: string | null;
  last_sync_count: number | null;
}

const PROVIDER_META: Record<Provider, { label: string; description: string; color: string }> = {
  quickbooks: {
    label: "QuickBooks Online",
    description: "Push bills and invoices directly to your QuickBooks ledger.",
    color: "bg-[#2CA01C]/10 border-[#2CA01C]/20",
  },
  xero: {
    label: "Xero",
    description: "Create draft bills and invoices in your Xero organisation.",
    color: "bg-[#00B5D8]/10 border-[#00B5D8]/20",
  },
  freshbooks: {
    label: "FreshBooks",
    description: "Sync expenses and invoices to your FreshBooks account.",
    color: "bg-[#0075DD]/10 border-[#0075DD]/20",
  },
};

function ProviderLogo({ provider }: { provider: Provider }) {
  // Simple text-based logos matching brand colours
  const styles: Record<Provider, string> = {
    quickbooks: "text-[#2CA01C] font-bold",
    xero: "text-[#00B5D8] font-bold",
    freshbooks: "text-[#0075DD] font-bold",
  };
  const labels: Record<Provider, string> = {
    quickbooks: "QB",
    xero: "X",
    freshbooks: "FB",
  };
  return (
    <div className="h-10 w-10 rounded-xl border bg-white flex items-center justify-center shrink-0">
      <span className={`text-sm ${styles[provider]}`}>{labels[provider]}</span>
    </div>
  );
}

export default function AccountingSyncSettings() {
  const { activeWorkspace } = useWorkspace();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState<Provider | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const orgId = activeWorkspace?.id ?? "";

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const params = new URLSearchParams({ action: "status" });
      if (orgId) params.set("org_id", orgId);

      const res = await fetch(`${OAUTH_FN}?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setIntegrations(data.integrations ?? []);
    } catch {
      toast.error("Could not load integrations.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Handle OAuth redirect back with ?connected=<provider>
  useEffect(() => {
    const connected = searchParams.get("connected") as Provider | null;
    const error = searchParams.get("error");
    if (connected) {
      toast.success(`${PROVIDER_META[connected]?.label ?? connected} connected successfully.`);
      loadIntegrations();
      setSearchParams((prev) => { prev.delete("connected"); return prev; });
    }
    if (error) {
      toast.error(`OAuth failed: ${error}. Please try again.`);
      setSearchParams((prev) => { prev.delete("error"); return prev; });
    }
  }, [searchParams]);

  const handleConnect = async (provider: Provider) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.error("Please log in first."); return; }

    const params = new URLSearchParams({
      action: "connect",
      provider,
      org_id: orgId,
      user_token: session.access_token,
    });

    // Open a popup so the user returns to the same page after OAuth
    const popup = window.open(
      `${OAUTH_FN}?${params}`,
      `connect_${provider}`,
      "width=600,height=700,scrollbars=yes"
    );

    // Poll for popup close, then reload integrations
    const timer = setInterval(() => {
      if (popup?.closed) {
        clearInterval(timer);
        loadIntegrations();
      }
    }, 1000);
  };

  const handleDisconnect = async (provider: Provider) => {
    setDisconnecting(provider);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Please log in first."); return; }

      const res = await fetch(`${OAUTH_FN}?action=disconnect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider, org_id: orgId || undefined }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Disconnect failed");
      }

      toast.success(`${PROVIDER_META[provider].label} disconnected.`);
      setIntegrations((prev) => prev.filter((i) => i.provider !== provider));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDisconnecting(null);
    }
  };

  const connected = (provider: Provider) => integrations.find((i) => i.provider === provider);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(["quickbooks", "xero", "freshbooks"] as Provider[]).map((provider) => {
        const meta = PROVIDER_META[provider];
        const conn = connected(provider);

        return (
          <Card key={provider} className={conn ? `border ${meta.color}` : ""}>
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <ProviderLogo provider={provider} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{meta.label}</p>
                    {conn ? (
                      <Badge variant="success" className="text-[10px] h-4 px-1.5 gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5" /> Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-muted-foreground">
                        Not connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>

                  {conn && (
                    <div className="mt-2 text-[11px] text-muted-foreground space-y-0.5">
                      <p>Connected {new Date(conn.connected_at).toLocaleDateString()}</p>
                      {conn.last_sync_at && (
                        <p>
                          Last sync: {new Date(conn.last_sync_at).toLocaleString()} — {conn.last_sync_count ?? 0} records
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  {conn ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDisconnect(provider)}
                      disabled={disconnecting === provider}
                    >
                      {disconnecting === provider ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Unlink className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Disconnect
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleConnect(provider)}>
                      <Link2 className="h-3.5 w-3.5 mr-1.5" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <div className="rounded-xl border border-border bg-muted/30 p-4 flex gap-3">
        <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-[11px] text-muted-foreground leading-5">
          Connecting an accounting platform requires the corresponding OAuth credentials to be configured
          by your administrator (<code className="font-mono">QUICKBOOKS_CLIENT_ID</code>,{" "}
          <code className="font-mono">XERO_CLIENT_ID</code>,{" "}
          <code className="font-mono">FRESHBOOKS_CLIENT_ID</code> env variables on the edge function).
          Once connected, use the <strong>Sync to Accounting</strong> button on the Exports page to push
          records directly to your ledger.
        </div>
      </div>
    </div>
  );
}

// Exported hook used by Exports.tsx to trigger a sync
export async function syncToAccounting(
  provider: Provider,
  type: "expenses" | "income",
  records: any[],
  orgId: string
): Promise<{ synced: number; errors: string[] }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await fetch(SYNC_FN, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ provider, org_id: orgId || undefined, type, records }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Sync failed");
  return data;
}
