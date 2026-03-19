import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, ToggleLeft, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/audit-log-client";

interface Flag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  segment: string;
  user_ids: string[];
  created_at: string;
  updated_at: string;
}

export default function AdminFeatureFlags() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", name: "", description: "", segment: "all" });
  const [saving, setSaving] = useState(false);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setFlags((data as Flag[]) || []);
    } catch (err: any) {
      toast.error("Failed to load flags: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFlags(); }, []);

  const handleCreate = async () => {
    if (!newFlag.key || !newFlag.name) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("feature_flags").insert({
        key: newFlag.key.toLowerCase().replace(/\s+/g, "_"),
        name: newFlag.name,
        description: newFlag.description || null,
        segment: newFlag.segment,
        enabled: false,
      });
      if (error) throw error;
      logAuditEvent({ action: "admin_flag_created", entityType: "feature_flag", entityId: newFlag.key, details: `Created flag: ${newFlag.name}` });
      toast.success("Feature flag created");
      setDialogOpen(false);
      setNewFlag({ key: "", name: "", description: "", segment: "all" });
      fetchFlags();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleFlag = async (flag: Flag) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ enabled: !flag.enabled, updated_at: new Date().toISOString() })
      .eq("id", flag.id);
    if (error) {
      toast.error("Failed to toggle: " + error.message);
      return;
    }
    logAuditEvent({ action: "admin_flag_toggled", entityType: "feature_flag", entityId: flag.id, details: `${flag.name} ${!flag.enabled ? "enabled" : "disabled"}` });
    setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, enabled: !f.enabled } : f));
    toast.success(`${flag.name} ${!flag.enabled ? "enabled" : "disabled"}`);
  };

  const updateSegment = async (flag: Flag, segment: string) => {
    const { error } = await supabase
      .from("feature_flags")
      .update({ segment, updated_at: new Date().toISOString() })
      .eq("id", flag.id);
    if (error) {
      toast.error("Failed to update: " + error.message);
      return;
    }
    setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, segment } : f));
  };

  const deleteFlag = async (flag: Flag) => {
    const { error } = await supabase.from("feature_flags").delete().eq("id", flag.id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
      return;
    }
    logAuditEvent({ action: "admin_flag_deleted", entityType: "feature_flag", entityId: flag.id, details: `Deleted flag: ${flag.name}` });
    setFlags((prev) => prev.filter((f) => f.id !== flag.id));
    toast.success("Flag deleted");
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ToggleLeft className="h-5 w-5 text-primary" /> Feature Flags
          </h2>
          <p className="text-sm text-muted-foreground">Toggle features on/off without redeploying</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchFlags}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Flag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Feature Flag</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Key (unique identifier)</Label>
                  <Input placeholder="e.g. beta_ai_extraction" value={newFlag.key} onChange={(e) => setNewFlag((p) => ({ ...p, key: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Display Name</Label>
                  <Input placeholder="e.g. Beta AI Extraction" value={newFlag.name} onChange={(e) => setNewFlag((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea placeholder="What this flag controls..." value={newFlag.description} onChange={(e) => setNewFlag((p) => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Segment</Label>
                  <Select value={newFlag.segment} onValueChange={(v) => setNewFlag((p) => ({ ...p, segment: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="specific">Specific Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={saving || !newFlag.key || !newFlag.name}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {flags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No feature flags yet. Create one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm">{flag.name}</h3>
                      <Badge variant="outline" className="text-[10px] font-mono">{flag.key}</Badge>
                      <Badge variant="secondary" className={`text-[10px] ${flag.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {flag.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    {flag.description && <p className="text-xs text-muted-foreground mb-2">{flag.description}</p>}
                    <div className="flex items-center gap-3">
                      <Select value={flag.segment} onValueChange={(v) => updateSegment(flag, v)}>
                        <SelectTrigger className="h-7 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="specific">Specific Users</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-muted-foreground">
                        Updated {new Date(flag.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch checked={flag.enabled} onCheckedChange={() => toggleFlag(flag)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteFlag(flag)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
