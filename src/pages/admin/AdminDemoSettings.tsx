import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2 } from "lucide-react";

interface DemoSettings {
  enabled: boolean;
  allowed_file_types: string[];
  max_file_size_mb: number;
  retention_minutes: number;
  max_uploads_per_day: number;
  rate_limit_per_minute: number;
  cta_button_text: string;
  show_sample_document: boolean;
  sample_fallback_mode: boolean;
}

const DEFAULTS: DemoSettings = {
  enabled: true,
  allowed_file_types: ["PDF", "PNG", "JPG", "JPEG"],
  max_file_size_mb: 10,
  retention_minutes: 60,
  max_uploads_per_day: 50,
  rate_limit_per_minute: 5,
  cta_button_text: "Start Free Trial",
  show_sample_document: true,
  sample_fallback_mode: false,
};

export default function AdminDemoSettingsPage() {
  const [settings, setSettings] = useState<DemoSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("demo_settings")
      .select("key, value");

    if (!error && data) {
      const merged = { ...DEFAULTS };
      data.forEach((row: any) => {
        if (row.key in merged) {
          (merged as any)[row.key] = row.value;
        }
      });
      setSettings(merged);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(settings);
      for (const [key, value] of entries) {
        await supabase
          .from("demo_settings")
          .update({ value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() })
          .eq("key", key);
      }
      toast.success("Demo settings saved!");
    } catch {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  const handleCleanup = async () => {
    setCleaning(true);
    try {
      const { data, error } = await supabase.functions.invoke("demo-cleanup");
      if (error) throw error;
      toast.success(`Cleanup complete. Deleted ${data?.deleted || 0} expired demo records.`);
    } catch {
      toast.error("Cleanup failed");
    }
    setCleaning(false);
  };

  const updateSetting = <K extends keyof DemoSettings>(key: K, value: DemoSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Demo Upload Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure the public demo uploader on the marketing website.
        </p>
      </div>

      {/* Enable/Disable */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable Public Demo</p>
              <p className="text-xs text-muted-foreground">
                Allow visitors to upload documents on the marketing site
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(v) => updateSetting("enabled", v)}
            />
          </div>
          <div className="space-y-2">
            <Label>CTA Button Text</Label>
            <Input
              value={settings.cta_button_text}
              onChange={(e) => updateSetting("cta_button_text", e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Show Sample Document Option</p>
              <p className="text-xs text-muted-foreground">
                Allow visitors to try with a pre-built sample invoice
              </p>
            </div>
            <Switch
              checked={settings.show_sample_document}
              onCheckedChange={(v) => updateSetting("show_sample_document", v)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Fallback Sample Mode</p>
              <p className="text-xs text-muted-foreground">
                Show sample results if AI extraction fails
              </p>
            </div>
            <Switch
              checked={settings.sample_fallback_mode}
              onCheckedChange={(v) => updateSetting("sample_fallback_mode", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* File Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">File Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Allowed File Types</Label>
            <div className="flex gap-2 flex-wrap">
              {settings.allowed_file_types.map((t) => (
                <Badge key={t} variant="secondary">{t}</Badge>
              ))}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max File Size (MB)</Label>
              <Input
                type="number"
                value={settings.max_file_size_mb}
                onChange={(e) => updateSetting("max_file_size_mb", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Retention Time (minutes)</Label>
              <Input
                type="number"
                value={settings.retention_minutes}
                onChange={(e) => updateSetting("retention_minutes", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Demo files are deleted after this time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rate Limiting & Abuse Protection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Uploads Per Day</Label>
              <Input
                type="number"
                value={settings.max_uploads_per_day}
                onChange={(e) => updateSetting("max_uploads_per_day", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Total demo uploads allowed per day (global)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Rate Limit Per Minute</Label>
              <Input
                type="number"
                value={settings.rate_limit_per_minute}
                onChange={(e) => updateSetting("rate_limit_per_minute", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                Max uploads per minute per session
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cleanup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cleanup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Expired Demo Data</p>
              <p className="text-xs text-muted-foreground">
                Manually trigger cleanup of expired demo uploads and files
              </p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleCleanup} disabled={cleaning}>
              {cleaning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Run Cleanup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Save Settings
      </Button>
    </div>
  );
}
