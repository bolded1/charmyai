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
    first_name: "", last_name: "", phone: "", job_title: "", timezone: "UTC", language: "en",
  });
  const [themeMode, setThemeMode] = useState<"light" | "dark" | "system">("system");

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
  }, [themeMode]);

  const handleSave = () => toast.success("Settings saved!");

  const handleProfileSave = async () => {
    try {
      await updateProfile.mutateAsync({
        first_name: profileForm.first_name || null, last_name: profileForm.last_name || null,
        phone: profileForm.phone || null, job_title: profileForm.job_title || null,
        timezone: profileForm.timezone, language: profileForm.language,
      });
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile."); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try { await uploadAvatar(file); toast.success("Avatar updated!"); }
    catch { toast.error("Failed to upload avatar."); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <label className="relative cursor-pointer group">
                    <Avatar className="h-14 w-14">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                      <AvatarFallback className="bg-muted text-muted-foreground text-base">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-4 w-4 text-white" />
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  <div>
                    <p className="text-sm font-medium">{profile?.full_name || profile?.email || "User"}</p>
                    <p className="text-xs text-muted-foreground">{profile?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">First Name</Label>
                      <Input value={profileForm.first_name} onChange={(e) => setProfileForm((p) => ({ ...p, first_name: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Last Name</Label>
                      <Input value={profileForm.last_name} onChange={(e) => setProfileForm((p) => ({ ...p, last_name: e.target.value }))} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <Input value={profile?.email || ""} disabled className="opacity-60" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <Input value={profileForm.phone} onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Job Title</Label>
                    <Input value={profileForm.job_title} onChange={(e) => setProfileForm((p) => ({ ...p, job_title: e.target.value }))} />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Timezone</Label>
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
                      <Label className="text-xs text-muted-foreground">Language</Label>
                      <Select value={profileForm.language} onValueChange={(v) => setProfileForm((p) => ({ ...p, language: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <Button onClick={handleProfileSave} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Company Name</Label>
                  <Input defaultValue="Acme Corp" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Input defaultValue="Germany" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">VAT Number</Label>
                  <Input defaultValue="DE123456789" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Default Currency</Label>
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
                <Label className="text-xs text-muted-foreground">Address</Label>
                <Input defaultValue="123 Main Street, Berlin, Germany" />
              </div>
              <Button onClick={handleSave}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System", icon: Monitor },
                  ] as const).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setThemeMode(value)}
                      className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors ${
                        themeMode === value ? "border-primary bg-brand-soft" : "border-border hover:bg-accent"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${themeMode === value ? "text-primary" : "text-muted-foreground"}`} />
                      <span className={`text-xs ${themeMode === value ? "text-primary font-medium" : "text-muted-foreground"}`}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Compact View</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing in tables</p>
                </div>
                <Switch />
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Preview</Label>
                <div className="rounded-lg border border-border overflow-hidden bg-background p-4">
                  <div className="flex gap-3">
                    <div className="w-24 shrink-0 rounded-md bg-sidebar p-2 space-y-1">
                      <div className="h-5 rounded-sm px-2 flex items-center" style={{ backgroundColor: "hsl(var(--sidebar-active-bg))" }}>
                        <span className="text-[9px] font-medium" style={{ color: "hsl(var(--sidebar-active-text))" }}>Dashboard</span>
                      </div>
                      <div className="h-5 rounded-sm px-2 flex items-center">
                        <span className="text-[9px] text-sidebar-foreground">Documents</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="rounded-md border border-border bg-card p-3">
                        <span className="text-xs font-medium">Card</span>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Body text</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 px-2.5 rounded-md bg-primary flex items-center">
                          <span className="text-[9px] font-medium text-primary-foreground">Primary</span>
                        </div>
                        <div className="h-6 px-2.5 rounded-md border border-border bg-card flex items-center">
                          <span className="text-[9px] text-foreground">Outline</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="success" className="text-[9px] h-4 px-1.5">Success</Badge>
                        <Badge variant="warning" className="text-[9px] h-4 px-1.5">Warning</Badge>
                        <Badge variant="info" className="text-[9px] h-4 px-1.5">Info</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Two-Factor Authentication</p>
                  <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                </div>
                <Button variant="outline" size="sm">Enable</Button>
              </div>
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Change Password</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                </div>
                <Button size="sm" onClick={handleSave}>Update</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardContent className="p-0">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Action</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">User</th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAuditLog.map((entry) => (
                    <tr key={entry.id} className="border-b border-border-subtle last:border-0 hover:bg-accent/40 transition-colors">
                      <td className="p-4">
                        <p className="text-sm">{entry.action}</p>
                        <p className="text-xs text-muted-foreground">{entry.details}</p>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{entry.user}</td>
                      <td className="p-4 text-sm text-muted-foreground text-right">{new Date(entry.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
