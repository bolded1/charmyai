import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { mockAuditLog } from "@/lib/mock-data";
import { toast } from "sonner";

export default function SettingsPage() {
  const handleSave = () => toast.success("Settings saved!");

  return (
    <div className="max-w-3xl mx-auto">
      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Company Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input defaultValue="Acme Corp" />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input defaultValue="Germany" />
                </div>
                <div className="space-y-2">
                  <Label>VAT Number</Label>
                  <Input defaultValue="DE123456789" />
                </div>
                <div className="space-y-2">
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
              <div className="space-y-2">
                <Label>Address</Label>
                <Input defaultValue="123 Main Street, Berlin, Germany" />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <p className="text-sm text-muted-foreground">Drop logo here</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Brand Color</Label>
                  <div className="flex gap-2">
                    {['#0d9488', '#2563eb', '#7c3aed', '#dc2626', '#f59e0b'].map((c) => (
                      <button key={c} className="h-8 w-8 rounded-full border-2 border-transparent hover:border-foreground transition-colors" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Dark Mode</p>
                  <p className="text-xs text-muted-foreground">Switch between light and dark themes</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Compact View</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing in tables and lists</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Security</CardTitle>
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

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockAuditLog.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between p-3 rounded-lg hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{entry.details}</p>
                    </div>
                    <div className="text-right shrink-0">
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
