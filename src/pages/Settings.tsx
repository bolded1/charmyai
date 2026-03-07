import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockAuditLog } from "@/lib/mock-data";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useLayoutSettings } from "@/hooks/useLayoutSettings";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, Loader2, Sun, Moon, Monitor, X, ImageIcon, Shield, Key, Smartphone, Clock, Check, Upload, Palette, Globe, Mail, Eye, EyeOff, RefreshCw } from "lucide-react";
import EmailImportSettings from "@/components/EmailImportSettings";
import { ALL_TIMEZONES } from "@/lib/timezones";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { AccentColorPicker } from "@/components/AccentColorPicker";
import { applyAccentColor, DEFAULT_ACCENT_COLOR } from "@/lib/color-utils";

/* ── Section Header helper ── */
function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  );
}

/* ── Field wrapper ── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

/* ── Setting Row (for toggles) ── */
function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, isLoading, updateProfile, uploadAvatar, initials } = useProfile();
  const [profileForm, setProfileForm] = useState({
    first_name: "", last_name: "", phone: "", job_title: "", timezone: "UTC", language: "en",
  });
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">(() => {
    return (localStorage.getItem("theme-mode") as "light" | "dark" | "system") || "system";
  });
  const { settings: layoutSettings, update: updateLayout } = useLayoutSettings();

  const { data: org } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const [logoLight, setLogoLight] = useState<string | null>(null);
  const [logoDark, setLogoDark] = useState<string | null>(null);
  const [appIcon, setAppIcon] = useState<string | null>(null);
  const brandInitialLoadRef = useRef(true);

  // Load branding from organization on mount / when org loads
  useEffect(() => {
    if (org) {
      setLogoLight(org.logo_light || null);
      setLogoDark(org.logo_dark || null);
      setAppIcon(org.app_icon || null);
      setTimeout(() => { brandInitialLoadRef.current = false; }, 100);
    }
  }, [org]);

  // Persist branding to organization table
  const saveBrandField = useCallback(async (field: "logo_light" | "logo_dark" | "app_icon", value: string | null) => {
    if (!org) return;
    try {
      await updateOrg.mutateAsync({ id: org.id, [field]: value });
    } catch {
      toast.error("Failed to save branding.");
    }
  }, [org, updateOrg]);

  useEffect(() => {
    if (brandInitialLoadRef.current) return;
    saveBrandField("logo_light", logoLight);
  }, [logoLight, saveBrandField]);
  useEffect(() => {
    if (brandInitialLoadRef.current) return;
    saveBrandField("logo_dark", logoDark);
  }, [logoDark, saveBrandField]);
  useEffect(() => {
    if (brandInitialLoadRef.current) return;
    saveBrandField("app_icon", appIcon);
  }, [appIcon, saveBrandField]);

  const [brandColors, setBrandColors] = useState(["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"]);
  const [brandPreviewMode, setBrandPreviewMode] = useState<"light" | "dark">("light");

  const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "", last_name: profile.last_name || "",
        phone: profile.phone || "", job_title: profile.job_title || "",
        timezone: profile.timezone || "UTC", language: profile.language || "en",
      });
    }
  }, [profile]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") root.classList.add("dark");
    else if (themeMode === "light") root.classList.remove("dark");
    else root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
    localStorage.setItem("theme-mode", themeMode);
    // Re-apply accent color since dark/light need different derived values
    applyAccentColor(org?.primary_color || DEFAULT_ACCENT_COLOR);
  }, [themeMode, org?.primary_color]);

  // Auto-save profile with debounce
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileReadyRef = useRef(false);
  const lastSavedFormRef = useRef<string>("");

  // Mark ready only after profile has populated the form
  useEffect(() => {
    if (profile && !profileReadyRef.current) {
      // Wait a tick so the form state from profile load is set
      setTimeout(() => {
        lastSavedFormRef.current = JSON.stringify(profileForm);
        profileReadyRef.current = true;
      }, 100);
    }
  }, [profile, profileForm]);

  useEffect(() => {
    if (!profileReadyRef.current) return;
    const serialized = JSON.stringify(profileForm);
    if (serialized === lastSavedFormRef.current) return;

    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
    profileTimerRef.current = setTimeout(async () => {
      try {
        await updateProfile.mutateAsync({
          first_name: profileForm.first_name || null, last_name: profileForm.last_name || null,
          phone: profileForm.phone || null, job_title: profileForm.job_title || null,
          timezone: profileForm.timezone, language: profileForm.language,
        });
        lastSavedFormRef.current = serialized;
        toast.success("Saved");
      } catch { toast.error("Failed to save."); }
    }, 800);
    return () => { if (profileTimerRef.current) clearTimeout(profileTimerRef.current); };
  }, [profileForm]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await uploadAvatar(file); toast.success("Avatar updated!"); }
    catch { toast.error("Failed to upload avatar."); }
  };

  const handleImageUpload = (setter: (url: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
      toast.success("Logo updated!");
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordUpdate = () => {
    if (!passwordForm.current || !passwordForm.new) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    if (passwordForm.new.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setPasswordForm({ current: "", new: "", confirm: "" });
    toast.success("Password updated!");
  };

  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "profile";

  return (
    <div className="max-w-3xl space-y-6">
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex w-auto min-w-max">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="email-import">Email Import</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
        </div>

        {/* ════════════════ PROFILE ════════════════ */}
        <TabsContent value="profile">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-6">
              {/* Avatar & Identity */}
              <Card>
                <CardContent className="p-6">
                  <SectionHeader title="Profile Photo" description="This will be displayed on your profile and in team views." />
                  <div className="flex items-center gap-5">
                    <label className="relative cursor-pointer group shrink-0">
                      <Avatar className="h-16 w-16">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-4 w-4 text-white" />
                      </div>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.full_name || profile?.email || "User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                      <p className="text-[11px] text-muted-foreground/70 mt-1">Click photo to upload. JPG, PNG or GIF. Max 2MB.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Info */}
              <Card>
                <CardContent className="p-6">
                  <SectionHeader title="Personal Information" description="Your name and contact details." />
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="First Name">
                        <Input value={profileForm.first_name} onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))} placeholder="John" />
                      </Field>
                      <Field label="Last Name">
                        <Input value={profileForm.last_name} onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))} placeholder="Smith" />
                      </Field>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Email" hint="This is the email you registered with and cannot be changed.">
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                          {profile?.email || "—"}
                        </div>
                      </Field>
                      <Field label="Phone">
                        <Input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+49 123 456 789" />
                      </Field>
                    </div>
                    <Field label="Job Title">
                      <Input value={profileForm.job_title} onChange={(e) => setProfileForm((p) => ({ ...p, job_title: e.target.value }))} placeholder="e.g. Finance Manager" />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card>
                <CardContent className="p-6">
                  <SectionHeader title="Preferences" description="Regional and language settings." />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Timezone">
                      <Select value={profileForm.timezone} onValueChange={(v) => setProfileForm((p) => ({ ...p, timezone: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-64">
                          {ALL_TIMEZONES.map((tz) => (
                            <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Language">
                      <Select value={profileForm.language} onValueChange={(v) => setProfileForm((p) => ({ ...p, language: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="it">Italiano</SelectItem>
                          <SelectItem value="pt">Português</SelectItem>
                          <SelectItem value="nl">Nederlands</SelectItem>
                          <SelectItem value="ja">日本語</SelectItem>
                          <SelectItem value="zh">中文</SelectItem>
                          <SelectItem value="ko">한국어</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </CardContent>
              </Card>

            </div>
          )}
        </TabsContent>

        {/* ════════════════ ORGANIZATION ════════════════ */}
        <TabsContent value="organization">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Company Details" description="Basic information about your organization." />
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Company Name">
                      <Input defaultValue="Acme Corp" />
                    </Field>
                    <Field label="Industry">
                      <Select defaultValue="technology">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="consulting">Consulting</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Country">
                      <Input defaultValue="Germany" />
                    </Field>
                    <Field label="Default Currency">
                      <Select defaultValue="EUR">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EUR">EUR — Euro</SelectItem>
                          <SelectItem value="USD">USD — US Dollar</SelectItem>
                          <SelectItem value="GBP">GBP — British Pound</SelectItem>
                          <SelectItem value="CHF">CHF — Swiss Franc</SelectItem>
                          <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                          <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                          <SelectItem value="JPY">JPY — Japanese Yen</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Tax & Legal" description="Tax registration and legal address." />
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="VAT Number" hint="Your tax identification number for invoicing.">
                      <Input defaultValue="DE123456789" />
                    </Field>
                    <Field label="Tax ID">
                      <Input placeholder="Optional" />
                    </Field>
                  </div>
                  <Field label="Registered Address">
                    <Input defaultValue="123 Main Street, Berlin, Germany" />
                  </Field>
                  <Field label="Website">
                    <Input placeholder="https://acme.com" />
                  </Field>
                </div>
              </CardContent>
            </Card>

          </div>
        </TabsContent>

        {/* ════════════════ EMAIL IMPORT ════════════════ */}
        <TabsContent value="email-import">
          <EmailImportSettings />
        </TabsContent>

        {/* ════════════════ APPEARANCE ════════════════ */}
        <TabsContent value="appearance">
          <div className="space-y-6">
            {/* Branding - Logos & Icons */}
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Company Branding" description="Upload your logo, icon, and favicon for light and dark themes." />
                
                {/* Mode toggle for preview context */}
                <div className="flex items-center gap-2 mb-5">
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => setBrandPreviewMode("light")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                        brandPreviewMode === "light" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <Sun className="h-3 w-3" /> Light
                    </button>
                    <button
                      onClick={() => setBrandPreviewMode("dark")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
                        brandPreviewMode === "dark" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      <Moon className="h-3 w-3" /> Dark
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">Preview and upload assets for each mode</p>
                </div>

                <div className={`rounded-xl border p-5 space-y-5 transition-colors ${
                  brandPreviewMode === "dark" ? "bg-[hsl(222,20%,8%)] border-[hsl(222,12%,18%)]" : "bg-muted/20 border-border"
                }`}>
                  {/* Logo Row */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className={`h-3.5 w-3.5 ${brandPreviewMode === "dark" ? "text-[hsl(215,10%,50%)]" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${brandPreviewMode === "dark" ? "text-[hsl(210,25%,90%)]" : "text-foreground"}`}>Logo</span>
                      <span className={`text-[10px] ${brandPreviewMode === "dark" ? "text-[hsl(215,10%,40%)]" : "text-muted-foreground/60"}`}>Recommended: 240 × 60 px, PNG or SVG with transparent background</span>
                    </div>
                    <BrandUploadBox
                      label="Primary Logo"
                      hint="Drop your logo here or click to upload"
                      image={brandPreviewMode === "light" ? logoLight : logoDark}
                      onUpload={handleImageUpload(brandPreviewMode === "light" ? setLogoLight : setLogoDark)}
                      onRemove={() => (brandPreviewMode === "light" ? setLogoLight : setLogoDark)(null)}
                      tall
                      dark={brandPreviewMode === "dark"}
                      wide
                    />
                  </div>

                  {/* Icon + Favicon Row */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className={`h-3.5 w-3.5 ${brandPreviewMode === "dark" ? "text-[hsl(215,10%,50%)]" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium ${brandPreviewMode === "dark" ? "text-[hsl(210,25%,90%)]" : "text-foreground"}`}>App Icon</span>
                      </div>
                      <BrandUploadBox
                        label="Icon"
                        hint="64 × 64 px, square"
                        image={brandPreviewMode === "light" ? iconLight : iconDark}
                        onUpload={handleImageUpload(brandPreviewMode === "light" ? setIconLight : setIconDark)}
                        onRemove={() => (brandPreviewMode === "light" ? setIconLight : setIconDark)(null)}
                        dark={brandPreviewMode === "dark"}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className={`h-3.5 w-3.5 ${brandPreviewMode === "dark" ? "text-[hsl(215,10%,50%)]" : "text-muted-foreground"}`} />
                        <span className={`text-xs font-medium ${brandPreviewMode === "dark" ? "text-[hsl(210,25%,90%)]" : "text-foreground"}`}>Favicon</span>
                      </div>
                      <BrandUploadBox
                        label="Favicon"
                        hint="32 × 32 px, .ico or .png"
                        image={favicon}
                        onUpload={handleImageUpload(setFavicon)}
                        onRemove={() => setFavicon(null)}
                        dark={brandPreviewMode === "dark"}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Theme" description="Choose how the interface looks." />
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "light", label: "Light", icon: Sun, desc: "Clean white interface" },
                    { value: "dark", label: "Dark", icon: Moon, desc: "Easy on the eyes" },
                    { value: "system", label: "System", icon: Monitor, desc: "Match your OS" },
                  ] as const).map(({ value, label, icon: Icon, desc }) => (
                    <button
                      key={value}
                      onClick={() => setThemeMode(value)}
                      className={`flex flex-col items-center gap-1.5 rounded-lg border p-4 transition-all ${
                        themeMode === value
                          ? "border-primary bg-brand-soft ring-1 ring-primary/20"
                          : "border-border hover:bg-accent hover:border-border-strong"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${themeMode === value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${themeMode === value ? "text-primary" : "text-foreground"}`}>{label}</span>
                      <span className="text-[10px] text-muted-foreground">{desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Accent Color */}
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Primary Accent Color" description="Applied to buttons, links, active states, highlights, and charts across the entire app." />
                <AccentColorPicker
                  currentColor={org?.primary_color || DEFAULT_ACCENT_COLOR}
                  onSave={async (hex) => {
                    if (!org) return;
                    await updateOrg.mutateAsync({ id: org.id, primary_color: hex });
                  }}
                />
              </CardContent>
            </Card>


          </div>
        </TabsContent>

        {/* ════════════════ SECURITY ════════════════ */}
        <TabsContent value="security">
          <div className="space-y-6">
            {/* Password */}
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Password" description="Change your password to keep your account secure." />
                <div className="space-y-4 max-w-md">
                  <Field label="Current Password">
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, current: e.target.value }))}
                    />
                  </Field>
                  <Field label="New Password" hint="Must be at least 8 characters.">
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, new: e.target.value }))}
                    />
                  </Field>
                  <Field label="Confirm New Password">
                    <Input
                      type="password"
                      placeholder="Repeat new password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                    />
                  </Field>
                  <Button size="sm" onClick={handlePasswordUpdate}>Update Password</Button>
                </div>
              </CardContent>
            </Card>

            {/* 2FA */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">Two-Factor Authentication</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security with an authenticator app.</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">Not enabled</Badge>
                    </div>
                    <Button variant="outline" size="sm" className="mt-3">Set Up 2FA</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sessions */}
            <Card>
              <CardContent className="p-6">
                <SectionHeader title="Active Sessions" description="Manage devices where you're currently signed in." />
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-brand-soft flex items-center justify-center">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          Current Session
                          <Badge variant="success" className="text-[10px] h-4 px-1.5">Active</Badge>
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <p className="text-[11px] text-muted-foreground">Last active: Just now</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-4 text-destructive hover:text-destructive">
                  Sign Out All Other Sessions
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30">
              <CardContent className="p-6">
                <SectionHeader title="Danger Zone" description="Irreversible and destructive actions." />
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-destructive">Delete Account</p>
                    <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data.</p>
                  </div>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground shrink-0">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ════════════════ AUDIT LOG ════════════════ */}
        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-medium">Activity Log</h3>
                <p className="text-xs text-muted-foreground mt-0.5">A record of actions taken on your account.</p>
              </div>
              <div className="divide-y divide-border-subtle">
                {mockAuditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent/30 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {entry.user.split(" ").map(n => n[0]).join("").toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.details}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-muted-foreground">{entry.user}</p>
                      <p className="text-[11px] text-muted-foreground/60 mt-0.5">{new Date(entry.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              {mockAuditLog.length === 0 && (
                <div className="text-center py-12 text-sm text-muted-foreground">No activity recorded yet.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Brand Upload Box Component ── */
function BrandUploadBox({
  label, hint, image, onUpload, onRemove, tall, dark, wide,
}: {
  label: string; hint: string; image: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void; tall?: boolean; dark?: boolean; wide?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className={`space-y-1.5 ${wide ? "" : ""}`}>
      <div
        className={`relative rounded-lg border border-dashed flex items-center justify-center overflow-hidden transition-all cursor-pointer group hover:border-primary/40 ${
          tall ? "h-28" : "h-20"
        } ${dark ? "bg-[hsl(222,20%,10%)] border-[hsl(222,12%,20%)]" : "bg-muted/20 border-border"}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => {
          e.preventDefault(); e.stopPropagation();
          const file = e.dataTransfer.files?.[0];
          if (file) {
            const fakeEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
            onUpload(fakeEvent);
          }
        }}
      >
        {image ? (
          <>
            <img src={image} alt={label} className="max-h-full max-w-full object-contain p-3" />
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-background/80 backdrop-blur border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${dark ? "bg-[hsl(222,15%,16%)]" : "bg-muted/60"}`}>
              <Upload className={`h-3.5 w-3.5 ${dark ? "text-[hsl(215,10%,40%)]" : "text-muted-foreground/50"}`} />
            </div>
            <div className="text-center">
              <span className={`text-[11px] font-medium block ${dark ? "text-[hsl(210,25%,70%)]" : "text-muted-foreground"}`}>Drop file or click to upload</span>
              <span className={`text-[10px] ${dark ? "text-[hsl(215,10%,35%)]" : "text-muted-foreground/50"}`}>{hint}</span>
            </div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onUpload} />
      </div>
    </div>
  );
}
