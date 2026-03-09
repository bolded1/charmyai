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

import { Upload, X, Sun, Moon, Check, Smartphone, Palette } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

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

// ── DB-backed auto-save hook ──
function useDbAutoSave(key: string, initialValue: string, delay = 800) {
  const [value, setValue] = useState<string>(initialValue);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingRef = useRef<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase
      .from("demo_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value != null) {
          const v = typeof data.value === "string" ? data.value : JSON.stringify(data.value);
          setValue(v);
        }
        setLoaded(true);
      });
  }, [key]);

  const update = useCallback((newValue: string) => {
    setValue(newValue);
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingRef.current = newValue;
    setSaving(true);
    timerRef.current = setTimeout(async () => {
      const { error } = await supabase
        .from("demo_settings")
        .upsert({ key, value: newValue }, { onConflict: "key" });
      if (error) {
        toast.error(`Failed to save ${key}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ["platform-limits"] });
      }
      pendingRef.current = null;
      setSaving(false);
    }, delay);
  }, [key, delay, queryClient]);

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      if (pendingRef.current !== null) {
        supabase
          .from("demo_settings")
          .upsert({ key, value: pendingRef.current }, { onConflict: "key" });
      }
    }
  }, [key]);

  return [value, update, saving, loaded] as const;
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

// ── Logo upload ──
function LogoUploadField({ label, storageKey, icon: Icon }: { label: string; storageKey: string; icon: React.ElementType }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("demo_settings").select("value").eq("key", storageKey).maybeSingle();
      const dbLogo = normalizeLogoValue(data?.value);
      if (dbLogo) { setPreview(dbLogo); return; }
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
        { key: storageKey, value: dataUrl }, { onConflict: "key" }
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

// ── PWA Icon Upload ──
function PwaIconUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("demo_settings").select("value").eq("key", "pwa-icon").maybeSingle()
      .then(({ data }) => {
        const val = data?.value;
        if (typeof val === "string" && (val.startsWith("data:image") || val.startsWith("http"))) {
          setPreview(val);
        } else if (typeof val === "string") {
          try {
            const parsed = JSON.parse(val);
            if (typeof parsed === "string" && parsed.startsWith("data:image")) setPreview(parsed);
          } catch { /* ignore */ }
        }
      });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Icon must be under 2MB");
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const { error } = await supabase.from("demo_settings").upsert(
        { key: "pwa-icon", value: dataUrl }, { onConflict: "key" }
      );
      setUploading(false);
      if (error) { toast.error(`Upload failed: ${error.message}`); return; }
      setPreview(dataUrl);
      window.dispatchEvent(new Event("pwa-settings-changed"));
      toast.success("PWA icon updated");
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async () => {
    const { error } = await supabase.from("demo_settings").delete().eq("key", "pwa-icon");
    if (error) { toast.error(`Failed to remove: ${error.message}`); return; }
    setPreview(null);
    window.dispatchEvent(new Event("pwa-settings-changed"));
    toast.success("PWA icon reset to default");
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="flex items-center gap-4">
          <div className="relative inline-block border rounded-xl p-3 bg-muted/30">
            <img src={preview} alt="PWA Icon" className="h-16 w-16 rounded-lg object-cover" />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Custom icon active</p>
            <p>Devices will update on next app reload.</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 border border-dashed rounded-lg px-4 py-4 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors w-full justify-center"
        >
          <Smartphone className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload PWA icon (512×512 PNG recommended)"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Splash Logo Upload (reuses same pattern) ──
function SplashLogoUpload() {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from("demo_settings").select("value").eq("key", "pwa-splash-logo").maybeSingle()
      .then(({ data }) => {
        const val = data?.value;
        if (typeof val === "string" && (val.startsWith("data:image") || val.startsWith("http"))) {
          setPreview(val);
        }
      });
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Splash logo must be under 2MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const { error } = await supabase.from("demo_settings").upsert(
        { key: "pwa-splash-logo", value: dataUrl }, { onConflict: "key" }
      );
      setUploading(false);
      if (error) { toast.error(`Upload failed: ${error.message}`); return; }
      setPreview(dataUrl);
      toast.success("Splash screen logo updated");
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async () => {
    await supabase.from("demo_settings").delete().eq("key", "pwa-splash-logo");
    setPreview(null);
    toast.success("Splash logo reset to default");
  };

  return (
    <div className="space-y-3">
      {preview ? (
        <div className="flex items-center gap-4">
          <div className="relative inline-block border rounded-xl p-3 bg-muted/30">
            <img src={preview} alt="Splash Logo" className="h-12 max-w-[12rem] object-contain" />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center text-xs hover:bg-destructive/90"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Custom splash logo active</p>
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 border border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:border-primary hover:text-foreground transition-colors w-full justify-center"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "Uploading…" : "Upload splash screen logo"}
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFile} />
      <p className="text-xs text-muted-foreground">Displayed on the splash screen when the app launches. PNG or SVG recommended.</p>
    </div>
  );
}

export default function AdminSettingsPage() {
  // Limits & Upload (DB-backed)
  const [maxFileSize, setMaxFileSize, mfsSaving] = useDbAutoSave("max-file-size", "20");
  const [maxFiles, setMaxFiles, mfSaving] = useDbAutoSave("max-files", "10");

  // Pro Plan (DB-backed)
  const [proDocsLimit, setProDocsLimit, pdlSaving] = useDbAutoSave("pro-docs-limit", "999999");
  const [proUsersLimit, setProUsersLimit, pulSaving] = useDbAutoSave("pro-users-limit", "10");

  // Email
  const [fromName, setFromName, fnSaving] = useAutoSave("from-name", "Charmy");
  const [fromEmail, setFromEmail, feSaving] = useAutoSave("from-email", "noreply@charmy.ai");
  const [welcomeEmail, setWelcomeEmail, weSaving] = useAutoSave("welcome-email", true);
  const [processingNotif, setProcessingNotif, pnSaving] = useAutoSave("processing-notif", true);

  // System (DB-backed)
  const [maintenance, setMaintenance, mtSaving] = useDbAutoSave("maintenance", "false");
  const [newSignups, setNewSignups, nsSaving] = useDbAutoSave("new-signups", "true");
  const [debugLog, setDebugLog, dlSaving] = useDbAutoSave("debug-log", "false");

  // PWA Settings (DB-backed)
  const [pwaName, setPwaName, pnmSaving] = useDbAutoSave("pwa-name", "Charmy - AI Financial Document Processing");
  const [pwaShortName, setPwaShortName, psnSaving] = useDbAutoSave("pwa-short-name", "Charmy");
  const [pwaThemeColor, setPwaThemeColor, ptcSaving] = useDbAutoSave("pwa-theme-color", "#2563EB");
  const [pwaBgColor, setPwaBgColor, pbcSaving] = useDbAutoSave("pwa-bg-color", "#f5f6fa");

  const systemQueryClient = useQueryClient();

  useEffect(() => {
    systemQueryClient.invalidateQueries({ queryKey: ["system-settings"] });
  }, [maintenance, newSignups, debugLog, systemQueryClient]);

  // Dispatch pwa-settings-changed when text fields change
  useEffect(() => {
    window.dispatchEvent(new Event("pwa-settings-changed"));
  }, [pwaName, pwaShortName, pwaThemeColor, pwaBgColor]);

  const anySaving = mfsSaving || mfSaving || pdlSaving || pulSaving ||
    fnSaving || feSaving || weSaving || pnSaving ||
    mtSaving || nsSaving || dlSaving ||
    pnmSaving || psnSaving || ptcSaving || pbcSaving;

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
          <TabsTrigger value="pwa">PWA</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* ── Branding Tab ── */}
        <TabsContent value="branding">
          <Card>
            <CardHeader><CardTitle className="text-base">Application Logo</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">Upload logos used across the homepage, sidebar, login, onboarding, and marketing pages.</p>
              <div className="grid sm:grid-cols-2 gap-6">
                <LogoUploadField label="Light Mode Logo" storageKey="brand-logo-light" icon={Sun} />
                <LogoUploadField label="Dark Mode Logo" storageKey="brand-logo-dark" icon={Moon} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── PWA Tab ── */}
        <TabsContent value="pwa">
          <div className="space-y-6">
            {/* Identity */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">App Identity</CardTitle>
                  <SaveIndicator saving={pnmSaving || psnSaving} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Configure how the app appears when installed on user devices.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>App Name</Label>
                    <Input value={pwaName} onChange={(e) => setPwaName(e.target.value)} placeholder="Charmy - AI Financial Document Processing" />
                    <p className="text-xs text-muted-foreground">Full name shown in app settings</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Short Name</Label>
                    <Input value={pwaShortName} onChange={(e) => setPwaShortName(e.target.value)} placeholder="Charmy" />
                    <p className="text-xs text-muted-foreground">Shown below the home screen icon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* App Icon */}
            <Card>
              <CardHeader><CardTitle className="text-base">App Icon</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a square icon (min 512×512px) displayed on home screens and app launchers.
                </p>
                <PwaIconUpload />
              </CardContent>
            </Card>

            {/* Splash Screen Logo */}
            <Card>
              <CardHeader><CardTitle className="text-base">Splash Screen Logo</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <SplashLogoUpload />
              </CardContent>
            </Card>

            {/* Colors */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Theme Colors</CardTitle>
                  <SaveIndicator saving={ptcSaving || pbcSaving} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">Customize the status bar and splash screen colors on mobile devices.</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                      Theme Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pwaThemeColor}
                        onChange={(e) => setPwaThemeColor(e.target.value)}
                        className="h-9 w-12 rounded border cursor-pointer"
                      />
                      <Input value={pwaThemeColor} onChange={(e) => setPwaThemeColor(e.target.value)} className="flex-1" placeholder="#2563EB" />
                    </div>
                    <p className="text-xs text-muted-foreground">Status bar & window chrome color</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                      Background Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={pwaBgColor}
                        onChange={(e) => setPwaBgColor(e.target.value)}
                        className="h-9 w-12 rounded border cursor-pointer"
                      />
                      <Input value={pwaBgColor} onChange={(e) => setPwaBgColor(e.target.value)} className="flex-1" placeholder="#f5f6fa" />
                    </div>
                    <p className="text-xs text-muted-foreground">Splash screen background color</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">PWA Features</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "Install Prompt", desc: "Users see an install banner after login", active: true },
                    { label: "Offline Support", desc: "App loads without internet, uploads queued", active: true },
                    { label: "Auto Updates", desc: "Users prompted to refresh for new versions", active: true },
                    { label: "App Shortcuts", desc: "Upload, Scan, Review shortcuts from home screen", active: true },
                    { label: "Push Notifications", desc: "Document processed, review needed alerts", active: true },
                    { label: "Background Processing", desc: "Documents process server-side after close", active: true },
                  ].map((f) => (
                    <div key={f.label} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                      <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${f.active ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      <div>
                        <p className="text-sm font-medium">{f.label}</p>
                        <p className="text-xs text-muted-foreground">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Limits Tab ── */}
        <TabsContent value="limits">
          <div className="space-y-6">
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

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Pro Plan Limits</CardTitle>
                  <SaveIndicator saving={pdlSaving || pulSaving} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Documents per Month</Label>
                    <Input type="number" value={proDocsLimit} onChange={(e) => setProDocsLimit(e.target.value)} />
                    <p className="text-xs text-muted-foreground">Set to 999999 for unlimited</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Max Team Members</Label>
                    <Input type="number" value={proUsersLimit} onChange={(e) => setProUsersLimit(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Email Tab ── */}
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

        {/* ── System Tab ── */}
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
                <Switch checked={maintenance === "true"} onCheckedChange={(v) => setMaintenance(v ? "true" : "false")} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New Signups</p>
                  <p className="text-xs text-muted-foreground">Allow new user registrations</p>
                </div>
                <Switch checked={newSignups === "true"} onCheckedChange={(v) => setNewSignups(v ? "true" : "false")} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Debug Logging</p>
                  <p className="text-xs text-muted-foreground">Enable verbose logging for troubleshooting</p>
                </div>
                <Switch checked={debugLog === "true"} onCheckedChange={(v) => setDebugLog(v ? "true" : "false")} />
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
