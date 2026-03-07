import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { mockAuditLog } from "@/lib/mock-data";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";
import { useState, useEffect } from "react";
import { Camera, Loader2, Sun, Moon, Monitor } from "lucide-react";

export default function SettingsPage() {
  const { profile, isLoading, updateProfile, uploadAvatar, initials } = useProfile();
  const [profileForm, setProfileForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    job_title: "",
    timezone: "UTC",
    language: "en",
  });
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    if (profile) {
      setProfileForm({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        phone: profile.phone || "",
        job_title: profile.job_title || "",
        timezone: profile.timezone || "UTC",
        language: profile.language || "en",
      });
    }
  }, [profile]);

  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else if (themeMode === "light") {
      root.classList.remove("dark");
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", prefersDark);
    }
  }, [themeMode]);

  const handleSave = () => toast.success("Settings saved!");

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: profileForm.first_name || null,
        last_name: profileForm.last_name || null,
        phone: profileForm.phone || null,
        job_title: profileForm.job_title || null,
        timezone: profileForm.timezone,
        language: profileForm.language,
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile.");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success("Avatar updated!");
    } catch {
      toast.error("Failed to upload avatar.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* ── My Profile ── */}
        <TabsContent value="profile">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <label className="relative cursor-pointer group">
                    <Avatar className="h-14 w-14">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary text-base font-medium">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  <div>
                    <p className="text-sm font-medium">{profile?.full_name || profile?.email || "User"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>First Name</Label>
                    <Input value={profileForm.first_name} onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Last Name</Label>
                    <Input value={profileForm.last_name} onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={profile?.email || ""} disabled className="opacity-60" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Job Title</Label>
                    <Input value={profileForm.job_title} onChange={(e) => setProfileForm((p) => ({ ...p, job_title: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Timezone</Label>
                    <Select value={profileForm.timezone} onValueChange={(v) => setProfileForm((p) => ({ ...p, timezone: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["UTC", "Europe/Berlin", "Europe/London", "America/New_York", "America/Los_Angeles", "Asia/Tokyo"].map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Language</Label>
                    <Select value={profileForm.language} onValueChange={(v) => setProfileForm((p) => ({ ...p, language: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleProfileSave} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Organization ── */}
        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company Name</Label>
                  <Input defaultValue="Acme Corp" />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Input defaultValue="Germany" />
                </div>
                <div className="space-y-1.5">
                  <Label>VAT Number</Label>
                  <Input defaultValue="DE123456789" />
                </div>
                <div className="space-y-1.5">
                  <Label>Default Currency</Label>
                  <Select defaultValue="EUR">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input defaultValue="123 Main Street, Berlin, Germany" />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Logo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">Drop logo here</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Brand Color</Label>
                  <div className="flex gap-2">
                    {['#0d9488', '#2563eb', '#7c3aed', '#dc2626', '#f59e0b'].map((c) => (
                      <button key={c} className="h-7 w-7 rounded-full border-2 border-transparent hover:border-foreground transition-colors" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Appearance with Theme Preview ── */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Mode Selector */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Theme Mode</Label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setThemeMode(value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-all ${
                        themeMode === value
                          ? "border-primary bg-brand-soft"
                          : "border-border hover:border-border-strong hover:bg-accent"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${themeMode === value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs font-medium ${themeMode === value ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Density */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Compact View</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing in tables and lists</p>
                </div>
                <Switch />
              </div>

              {/* Theme Preview Panel */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Preview</Label>
                <div className="rounded-lg border border-border overflow-hidden">
                  {/* Simulated page */}
                  <div className="bg-background p-4 space-y-3">
                    {/* Mini sidebar + content */}
                    <div className="flex gap-3">
                      {/* Mini sidebar */}
                      <div className="w-28 shrink-0 rounded-md bg-sidebar p-2 space-y-1">
                        <div className="h-5 rounded-sm bg-sidebar-accent px-2 flex items-center">
                          <span className="text-[9px] font-medium text-sidebar-accent-foreground">Dashboard</span>
                        </div>
                        <div className="h-5 rounded-sm px-2 flex items-center">
                          <span className="text-[9px] text-sidebar-foreground">Documents</span>
                        </div>
                        <div className="h-5 rounded-sm px-2 flex items-center">
                          <span className="text-[9px] text-sidebar-foreground">Expenses</span>
                        </div>
                      </div>
                      {/* Content area */}
                      <div className="flex-1 space-y-3">
                        {/* Card preview */}
                        <div className="rounded-md border border-border bg-card p-3 shadow-theme-sm">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-card-foreground">Card Title</span>
                            <Badge variant="default" className="text-[9px] h-4 px-1.5">Active</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">Body text with muted foreground color.</p>
                        </div>
                        {/* Buttons row */}
                        <div className="flex gap-2">
                          <div className="h-6 px-2.5 rounded-md bg-primary flex items-center">
                            <span className="text-[9px] font-medium text-primary-foreground">Primary</span>
                          </div>
                          <div className="h-6 px-2.5 rounded-md border border-border bg-card flex items-center">
                            <span className="text-[9px] font-medium text-foreground">Secondary</span>
                          </div>
                          <div className="h-6 px-2.5 rounded-md bg-destructive flex items-center">
                            <span className="text-[9px] font-medium text-destructive-foreground">Danger</span>
                          </div>
                        </div>
                        {/* Input preview */}
                        <div className="h-7 rounded-md border border-input bg-card px-2 flex items-center">
                          <span className="text-[10px] text-muted-foreground/70">Input placeholder...</span>
                        </div>
                        {/* Badges row */}
                        <div className="flex gap-2">
                          <Badge variant="success" className="text-[9px] h-4 px-1.5">Success</Badge>
                          <Badge variant="warning" className="text-[9px] h-4 px-1.5">Warning</Badge>
                          <Badge variant="info" className="text-[9px] h-4 px-1.5">Info</Badge>
                          <Badge variant="destructive" className="text-[9px] h-4 px-1.5">Error</Badge>
                        </div>
                        {/* Mini table */}
                        <div className="rounded-md border border-border overflow-hidden">
                          <div className="bg-muted/30 px-2 py-1 border-b border-border-subtle">
                            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">Name</span>
                          </div>
                          <div className="px-2 py-1.5 border-b border-border-subtle hover:bg-accent/50 transition-colors">
                            <span className="text-[10px] text-foreground">John Smith</span>
                          </div>
                          <div className="px-2 py-1.5 hover:bg-accent/50 transition-colors">
                            <span className="text-[10px] text-foreground">Maria Lee</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security ── */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="space-y-2">
                <Label>Change Password</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                </div>
                <Button size="sm" onClick={handleSave}>Update Password</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Audit Log ── */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {mockAuditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between p-3 rounded-md hover:bg-accent/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{entry.details}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-muted-foreground">{entry.user}</p>
                      <p className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
