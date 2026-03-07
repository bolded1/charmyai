import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useRef, useCallback, useEffect } from "react";
import { Upload, X, Sun, Moon, Check } from "lucide-react";

// ── Auto-save hook with debounce ──
function useAutoSave<T>(key: string, initialValue: T, delay = 800) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`admin-setting-${key}`);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const update = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof newValue === "function" ? (newValue as (prev: T) => T)(prev) : newValue;
      if (timerRef.current) clearTimeout(timerRef.current);
      setSaving(true);
      timerRef.current = setTimeout(() => {
        localStorage.setItem(`admin-setting-${key}`, JSON.stringify(resolved));
        setSaving(false);
      }, delay);
      return resolved;
    });
  }, [key, delay]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return [value, update, saving] as const;
}

function SaveIndicator({ saving }: { saving: boolean }) {
  if (!saving) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground animate-fade-in">
      <Check className="h-3 w-3" /> Saving…
    </span>
  );
}

// ── Logo upload with auto-save via database (demo_settings) ──
function LogoUploadField({ label, storageKey, icon: Icon }: { label: string; storageKey: string; icon: React.ElementType }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("demo_settings").select("value").eq("key", storageKey).maybeSingle().then(({ data }) => {
      if (data?.value) setPreview(data.value as string);
    });
  }, [storageKey]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const { error } = await supabase.from("demo_settings").upsert(
        { key: storageKey, value: JSON.stringify(dataUrl) },
        { onConflict: "key" }
      );
      if (error) { toast.error("Failed to save logo"); return; }
      setPreview(dataUrl);
      window.dispatchEvent(new Event("brand-logo-changed"));
      toast.success(`${label} updated`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    await supabase.from("demo_settings").delete().eq("key", storageKey);
    setPreview(null);
    window.dispatchEvent(new Event("brand-logo-changed"));
    toast.success(`${label} removed`);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1.5 text-sm">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {label}
      </Label>
      {preview ? (
        <div className="relative inline-block border rounded-lg p-3 bg-muted/30">
          <img src={preview} alt={label} className="h-12 max-w-[12rem] object-contain" />
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 border border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
        >
          <Upload className="h-4 w-4" />
          Upload logo
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <p className="text-xs text-muted-foreground">PNG, SVG, or JPG. Max 2MB.</p>
    </div>
  );
}

export default function AdminSettingsPage() {
  // AI settings
  const [aiEnabled, setAiEnabled, aiSaving] = useAutoSave("ai-enabled", true);
  const [aiModel, setAiModel, aiModelSaving] = useAutoSave("ai-model", "gemini-flash");
  const [confidenceThreshold, setConfidenceThreshold, confSaving] = useAutoSave("confidence-threshold", "70");
  const [autoApprove, setAutoApprove, autoAppSaving] = useAutoSave("auto-approve", false);

  // Limits
  const [maxFileSize, setMaxFileSize, mfsSaving] = useAutoSave("max-file-size", "20");
  const [maxFiles, setMaxFiles, mfSaving] = useAutoSave("max-files", "10");
  const [starterDocs, setStarterDocs, sdSaving] = useAutoSave("starter-docs", "50");
  const [proDocs, setProDocs, pdSaving] = useAutoSave("pro-docs", "500");
  const [entDocs, setEntDocs, edSaving] = useAutoSave("ent-docs", "999999");

  // Email
  const [fromName, setFromName, fnSaving] = useAutoSave("from-name", "Charmy");
  const [fromEmail, setFromEmail, feSaving] = useAutoSave("from-email", "noreply@charmy.ai");
  const [welcomeEmail, setWelcomeEmail, weSaving] = useAutoSave("welcome-email", true);
  const [processingNotif, setProcessingNotif, pnSaving] = useAutoSave("processing-notif", true);

  // System
  const [maintenance, setMaintenance, mtSaving] = useAutoSave("maintenance", false);
  const [newSignups, setNewSignups, nsSaving] = useAutoSave("new-signups", true);
  const [debugLog, setDebugLog, dlSaving] = useAutoSave("debug-log", false);

  const anySaving = aiSaving || aiModelSaving || confSaving || autoAppSaving ||
    mfsSaving || mfSaving || sdSaving || pdSaving || edSaving ||
    fnSaving || feSaving || weSaving || pnSaving ||
    mtSaving || nsSaving || dlSaving;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div />
        {anySaving && (
          <span className="text-[11px] text-muted-foreground animate-pulse">Auto-saving…</span>
        )}
      </div>

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="ai">AI Processing</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader><CardTitle className="text-base">Application Logo</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">Upload logos used across the homepage, sidebar, login, onboarding, and marketing pages. Provide separate versions for light and dark themes.</p>
              <div className="grid sm:grid-cols-2 gap-6">
                <LogoUploadField label="Light Mode Logo" storageKey="brand-logo-light" icon={Sun} />
                <LogoUploadField label="Dark Mode Logo" storageKey="brand-logo-dark" icon={Moon} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">AI Processing Configuration</CardTitle>
                <SaveIndicator saving={aiSaving || aiModelSaving || confSaving || autoAppSaving} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">AI Document Processing</p>
                  <p className="text-xs text-muted-foreground">Enable or disable AI extraction globally</p>
                </div>
                <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
              </div>
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini-flash">Gemini 3 Flash (Fast)</SelectItem>
                    <SelectItem value="gemini-pro">Gemini 2.5 Pro (Accurate)</SelectItem>
                    <SelectItem value="gpt5-mini">GPT-5 Mini (Balanced)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Confidence Threshold (%)</Label>
                <Input type="number" value={confidenceThreshold} onChange={(e) => setConfidenceThreshold(e.target.value)} />
                <p className="text-xs text-muted-foreground">Documents below this threshold will be flagged for manual review</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-Approve High Confidence</p>
                  <p className="text-xs text-muted-foreground">Automatically approve documents with 95%+ confidence</p>
                </div>
                <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Default Limits</CardTitle>
                <SaveIndicator saving={mfsSaving || mfSaving || sdSaving || pdSaving || edSaving} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max File Size (MB)</Label>
                  <Input type="number" value={maxFileSize} onChange={(e) => setMaxFileSize(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Max Files Per Upload</Label>
                  <Input type="number" value={maxFiles} onChange={(e) => setMaxFiles(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Supported File Types</Label>
                <div className="flex gap-2 flex-wrap">
                  {["PDF", "PNG", "JPG", "JPEG"].map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Starter Docs/Mo</Label>
                  <Input type="number" value={starterDocs} onChange={(e) => setStarterDocs(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Pro Docs/Mo</Label>
                  <Input type="number" value={proDocs} onChange={(e) => setProDocs(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Enterprise Docs/Mo</Label>
                  <Input type="number" value={entDocs} onChange={(e) => setEntDocs(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">System Email Settings</CardTitle>
                <SaveIndicator saving={fnSaving || feSaving || weSaving || pnSaving} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Welcome Email</p>
                  <p className="text-xs text-muted-foreground">Send welcome email on signup</p>
                </div>
                <Switch checked={welcomeEmail} onCheckedChange={setWelcomeEmail} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Processing Notifications</p>
                  <p className="text-xs text-muted-foreground">Notify users when documents are processed</p>
                </div>
                <Switch checked={processingNotif} onCheckedChange={setProcessingNotif} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">System Configuration</CardTitle>
                <SaveIndicator saving={mtSaving || nsSaving || dlSaving} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Disable the platform for all users except admins</p>
                </div>
                <Switch checked={maintenance} onCheckedChange={setMaintenance} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New Signups</p>
                  <p className="text-xs text-muted-foreground">Allow new user registrations</p>
                </div>
                <Switch checked={newSignups} onCheckedChange={setNewSignups} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Debug Logging</p>
                  <p className="text-xs text-muted-foreground">Enable verbose logging for troubleshooting</p>
                </div>
                <Switch checked={debugLog} onCheckedChange={setDebugLog} />
              </div>
              <div className="space-y-2">
                <Label>Platform Version</Label>
                <div className="flex items-center gap-2">
                  <Input disabled defaultValue="1.0.0" className="w-32" />
                  <Badge variant="secondary" className="bg-primary/10 text-primary">Latest</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
