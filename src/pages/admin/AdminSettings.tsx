import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const handleSave = () => toast.success("Settings saved!");

  return (
    <div className="max-w-3xl mx-auto">
      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="ai">AI Processing</TabsTrigger>
          <TabsTrigger value="limits">Limits</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

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
                  <Input defaultValue="DocuLedger" />
                </div>
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input defaultValue="noreply@doculedger.com" />
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
