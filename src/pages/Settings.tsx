import { supabase } from "@/integrations/supabase/client";
import BillingSection from "@/components/BillingSection";
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
import { Camera, Loader2, Shield, Key, Smartphone, Clock, Eye, EyeOff, Lock } from "lucide-react";
import EmailImportSettings from "@/components/EmailImportSettings";
import { ALL_TIMEZONES } from "@/lib/timezones";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { useClientRole } from "@/hooks/useClientRole";

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
  const { settings: layoutSettings, update: updateLayout } = useLayoutSettings();

  const { data: org } = useOrganization();
  const updateOrg = useUpdateOrganization();
  const { isClient } = useClientRole();

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
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="organization">Organization</TabsTrigger>
            <TabsTrigger value="email-import">Email Import</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
        </div>

        {/* ════════════════ BILLING ════════════════ */}
        <TabsContent value="billing">
          <BillingSection />
        </TabsContent>

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
          {isClient ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <h3 className="text-sm font-medium text-foreground">Organization Details</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">These settings are managed by your accounting firm and cannot be edited.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Company Name">
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                          {org?.name || "—"}
                        </div>
                      </Field>
                      <Field label="Trading Name">
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                          {org?.trading_name || "—"}
                        </div>
                      </Field>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Country">
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                          {org?.country || "—"}
                        </div>
                      </Field>
                      <Field label="Default Currency">
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                          {org?.default_currency || "EUR"}
                        </div>
                      </Field>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <SectionHeader title="Tax & Legal" description="Set by your accounting firm." />
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="VAT Number">
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                          {org?.vat_number || "—"}
                        </div>
                      </Field>
                      <Field label="Tax ID">
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                          {org?.tax_id || "—"}
                        </div>
                      </Field>
                    </div>
                    <Field label="Registered Address">
                      <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                        {org?.address || "—"}
                      </div>
                    </Field>
                    <Field label="Contact Email">
                      <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground cursor-not-allowed select-none">
                        {org?.contact_email || "—"}
                      </div>
                    </Field>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
          <OrgSettingsForm org={org} updateOrg={updateOrg} />
          )
          )}
        </TabsContent>

        {/* ════════════════ EMAIL IMPORT ════════════════ */}
        <TabsContent value="email-import">
          <EmailImportSettings />
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

