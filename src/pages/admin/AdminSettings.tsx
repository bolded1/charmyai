import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, useRef } from "react";
import { Upload, X, Sun, Moon } from "lucide-react";

function LogoUploadField({ label, storageKey, icon: Icon }: { label: string; storageKey: string; icon: React.ElementType }) {
  const [preview, setPreview] = useState<string | null>(() => localStorage.getItem(storageKey));
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      localStorage.setItem(storageKey, dataUrl);
      setPreview(dataUrl);
      window.dispatchEvent(new Event("brand-logo-changed"));
      toast.success(`${label} updated`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
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
  const handleSave = () => toast.success("Settings saved!");

  return (
    <div className="max-w-3xl mx-auto">
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
              <p className="text-sm text-muted-foreground">Upload logos used across the homepage, sidebar, and marketing pages. Provide separate versions for light and dark themes.</p>
              <div className="grid sm:grid-cols-2 gap-6">
                <LogoUploadField label="Light Mode Logo" storageKey="brand-logo-light" icon={Sun} />
                <LogoUploadField label="Dark Mode Logo" storageKey="brand-logo-dark" icon={Moon} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <Card>
            <CardHeader><CardTitle className="text-base">AI Processing Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">AI Document Processing</p>
                  <p className="text-xs text-muted-foreground">Enable or disable AI extraction globally</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>AI Model</Label>
                <Select defaultValue="gemini-flash">
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
                <Input type="number" defaultValue="70" />
                <p className="text-xs text-muted-foreground">Documents below this threshold will be flagged for manual review</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Auto-Approve High Confidence</p>
                  <p className="text-xs text-muted-foreground">Automatically approve documents with 95%+ confidence</p>
                </div>
                <Switch />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card>
            <CardHeader><CardTitle className="text-base">Default Limits</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max File Size (MB)</Label>
                  <Input type="number" defaultValue="20" />
                </div>
                <div className="space-y-2">
                  <Label>Max Files Per Upload</Label>
                  <Input type="number" defaultValue="10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Supported File Types</Label>
                <div className="flex gap-2 flex-wrap">
                  {["PDF", "PNG", "JPG", "JPEG"].map((t) => (
                    <Badge key={t} variant="secondary">{t}</Badge>
                  ))}
                </div>
                <Input placeholder="Add file type..." />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Starter Docs/Mo</Label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div className="space-y-2">
                  <Label>Pro Docs/Mo</Label>
                  <Input type="number" defaultValue="500" />
                </div>
                <div className="space-y-2">
                  <Label>Enterprise Docs/Mo</Label>
                  <Input type="number" defaultValue="999999" />
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader><CardTitle className="text-base">System Email Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input defaultValue="Charmy" />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input defaultValue="noreply@charmy.ai" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Welcome Email</p>
                  <p className="text-xs text-muted-foreground">Send welcome email on signup</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Processing Notifications</p>
                  <p className="text-xs text-muted-foreground">Notify users when documents are processed</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader><CardTitle className="text-base">System Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Maintenance Mode</p>
                  <p className="text-xs text-muted-foreground">Disable the platform for all users except admins</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">New Signups</p>
                  <p className="text-xs text-muted-foreground">Allow new user registrations</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Debug Logging</p>
                  <p className="text-xs text-muted-foreground">Enable verbose logging for troubleshooting</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label>Platform Version</Label>
                <div className="flex items-center gap-2">
                  <Input disabled defaultValue="1.0.0" className="w-32" />
                  <Badge variant="secondary" className="bg-primary/10 text-primary">Latest</Badge>
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
