import { supabase } from "@/integrations/supabase/client";
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
  const pendingValueRef = useRef<T | null>(null);

  const update = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof newValue === "function" ? (newValue as (prev: T) => T)(prev) : newValue;
      if (timerRef.current) clearTimeout(timerRef.current);
      pendingValueRef.current = resolved;
      setSaving(true);
      timerRef.current = setTimeout(() => {
        localStorage.setItem(`admin-setting-${key}`, JSON.stringify(resolved));
        pendingValueRef.current = null;
        setSaving(false);
      }, delay);
      return resolved;
    });
  }, [key, delay]);

  // Flush pending save on unmount instead of discarding it
  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      if (pendingValueRef.current !== null) {
        localStorage.setItem(`admin-setting-${key}`, JSON.stringify(pendingValueRef.current));
      }
    }
  }, [key]);

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

function normalizeLogoValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("data:image")) return value;

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" && parsed.startsWith("data:image") ? parsed : null;
  } catch {
    return null;
  }
}

// ── Logo upload with auto-save via database (demo_settings) ──
function LogoUploadField({ label, storageKey, icon: Icon }: { label: string; storageKey: string; icon: React.ElementType }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("demo_settings").select("value").eq("key", storageKey).maybeSingle();
      const dbLogo = normalizeLogoValue(data?.value);

      if (dbLogo) {
        setPreview(dbLogo);
        return;
      }

      const legacyLocalLogo = localStorage.getItem(storageKey);
      if (legacyLocalLogo && legacyLocalLogo.startsWith("data:image")) {
        setPreview(legacyLocalLogo);
        await supabase.from("demo_settings").upsert({ key: storageKey, value: legacyLocalLogo }, { onConflict: "key" });
        window.dispatchEvent(new Event("brand-logo-changed"));
      }
    };

    load();
  }, [storageKey]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const { error } = await supabase.from("demo_settings").upsert(
        { key: storageKey, value: dataUrl },
        { onConflict: "key" }
      );
      if (error) { toast.error(`Failed to save logo: ${error.message}`); return; }
      localStorage.removeItem(storageKey);
      setPreview(dataUrl);
      window.dispatchEvent(new Event("brand-logo-changed"));
      toast.success(`${label} updated`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = async () => {
    const { error } = await supabase.from("demo_settings").delete().eq("key", storageKey);
    if (error) { toast.error(`Failed to remove logo: ${error.message}`); return; }
    localStorage.removeItem(storageKey);
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

  // Limits & Upload
  const [maxFileSize, setMaxFileSize, mfsSaving] = useAutoSave("max-file-size", "20");
  const [maxFiles, setMaxFiles, mfSaving] = useAutoSave("max-files", "10");

  // Plan limits
  const [freeDocsLimit, setFreeDocsLimit, fdlSaving] = useAutoSave("free-docs-limit", "50");
  const [freeUsersLimit, setFreeUsersLimit, fulSaving] = useAutoSave("free-users-limit", "1");

  const [proDocsLimit, setProDocsLimit, pdlSaving] = useAutoSave("pro-docs-limit", "999999");
  const [proUsersLimit, setProUsersLimit, pulSaving] = useAutoSave("pro-users-limit", "10");

  // Pricing
  const [proMonthlyPrice, setProMonthlyPrice, pmpSaving] = useAutoSave("pro-monthly-price", "9.99");
  const [proYearlyPrice, setProYearlyPrice, pypSaving] = useAutoSave("pro-yearly-price", "99");
  const [trialDays, setTrialDays, tdSaving] = useAutoSave("trial-days", "14");

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
    mfsSaving || mfSaving || fdlSaving || fulSaving || pdlSaving || pulSaving ||
    pmpSaving || pypSaving || tdSaving ||
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
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="branding">Branding</TabsTrigger>
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
          <div className="space-y-6">
            {/* Upload Limits */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Upload Limits</CardTitle>
                  <SaveIndicator saving={mfsSaving || mfSaving} />
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
              </CardContent>
            </Card>

            {/* Pricing & Trial */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pricing & Trial</CardTitle>
                  <SaveIndicator saving={pmpSaving || pypSaving || tdSaving} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pro Monthly Price (€)</Label>
                    <Input type="number" step="0.01" value={proMonthlyPrice} onChange={(e) => setProMonthlyPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Pro Yearly Price (€)</Label>
                    <Input type="number" step="0.01" value={proYearlyPrice} onChange={(e) => setProYearlyPrice(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Trial Days</Label>
                    <Input type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Note: Changing prices here updates the displayed values. To change actual Stripe pricing, update your Stripe products.</p>
              </CardContent>
            </Card>

            {/* Plan Limits */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Plan Limits</CardTitle>
                  <SaveIndicator saving={fdlSaving || fulSaving || pdlSaving || pulSaving} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-3">Free Plan</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Documents per Month</Label>
                      <Input type="number" value={freeDocsLimit} onChange={(e) => setFreeDocsLimit(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Users</Label>
                      <Input type="number" value={freeUsersLimit} onChange={(e) => setFreeUsersLimit(e.target.value)} />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-3">Pro Plan</h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Documents per Month</Label>
                      <Input type="number" value={proDocsLimit} onChange={(e) => setProDocsLimit(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Set to 999999 for unlimited</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Users</Label>
                      <Input type="number" value={proUsersLimit} onChange={(e) => setProUsersLimit(e.target.value)} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
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
