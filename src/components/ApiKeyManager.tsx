import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
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

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export default function ApiKeyManager() {
  const { t } = useTranslation();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  
  const [revokeId, setRevokeId] = useState<string | null>(null);

  const apiBaseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1`;

  const fetchKeys = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${apiBaseUrl}/api-keys`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      const json = await res.json();
      if (res.ok) {
        setKeys((json.data ?? []).filter((k: ApiKey) => !k.revoked_at));
      }
    } catch {
      toast.error(t("apiKeys.loadError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchKeys(); }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      toast.error(t("apiKeys.enterName"));
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${apiBaseUrl}/api-keys`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const json = await res.json();
      if (res.ok) {
        setNewlyCreatedKey(json.api_key);
        setShowKey(true);
        setNewKeyName("");
        fetchKeys();
        toast.success(t("apiKeys.createSuccess"));
      } else {
        toast.error(json.error || t("apiKeys.createError"));
      }
    } catch {
      toast.error(t("apiKeys.createError"));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${apiBaseUrl}/api-keys/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (res.ok) {
        setKeys(prev => prev.filter(k => k.id !== id));
        toast.success(t("apiKeys.revokeSuccess"));
      }
    } catch {
      toast.error(t("apiKeys.revokeError"));
    } finally {
      setRevokeId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("apiKeys.copied"));
  };

  return (
    <div className="space-y-4">
      {/* Newly created key banner */}
      {newlyCreatedKey && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{t("apiKeys.yourNewKey")}</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  {t("apiKeys.copyNowWarning")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-muted/60 px-3 py-2 font-mono text-[11px] text-foreground break-all">
                    {showKey ? newlyCreatedKey : "••••••••••••••••••••••••••••••••"}
                  </code>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setShowKey(!showKey)}>
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => copyToClipboard(newlyCreatedKey)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="shrink-0 text-xs" onClick={() => setNewlyCreatedKey(null)}>
                {t("apiKeys.dismiss")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create key */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">{t("apiKeys.newApiKey")}</label>
          <Input
            placeholder={t("apiKeys.placeholder")}
            value={newKeyName}
            onChange={e => setNewKeyName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleCreate()}
          />
        </div>
        <Button onClick={handleCreate} disabled={creating} size="sm">
          {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          <span className="ml-1.5">{t("apiKeys.createKey")}</span>
        </Button>
      </div>

      {/* Key list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          {t("apiKeys.noKeysYet")}
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map(key => (
            <div
              key={key.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{key.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-[11px] text-muted-foreground font-mono">{key.key_prefix}••••</code>
                    <span className="text-[10px] text-muted-foreground/60">
                      {t("apiKeys.created")} {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    {key.last_used_at && (
                      <span className="text-[10px] text-muted-foreground/60">
                        · {t("apiKeys.lastUsed")} {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setRevokeId(key.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Revoke confirmation */}
      <AlertDialog open={!!revokeId} onOpenChange={open => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("apiKeys.revokeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("apiKeys.revokeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => revokeId && handleRevoke(revokeId)}
            >
              {t("apiKeys.revokeKey")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
