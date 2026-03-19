import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Download, Trash2, Loader2, Search, Shield, FileJson, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { logAuditEvent } from "@/lib/audit-log-client";

export default function AdminGDPR() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ user_id: string; email: string; full_name: string | null; created_at: string }>>([]);
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; email: string } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exportPreview, setExportPreview] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const searchUser = async () => {
    if (!email.trim() && !userId.trim()) return;
    setSearching(true);
    try {
      let query = supabase.from("profiles").select("user_id, email, full_name, created_at");
      if (email.trim()) {
        query = query.ilike("email", `%${email.trim()}%`);
      }
      if (userId.trim()) {
        query = query.eq("user_id", userId.trim());
      }
      const { data, error } = await query.limit(10);
      if (error) throw error;
      setSearchResults(data || []);
      if ((data || []).length === 0) toast.info("No users found matching your search");
    } catch (err: any) {
      toast.error("Search failed: " + err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleExport = async () => {
    if (!selectedUser) return;
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("admin-gdpr", {
        body: { action: "export", user_id: selectedUser.user_id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message);

      setExportPreview(res.data);

      // Also download as JSON file
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `gdpr-export-${selectedUser.user_id}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      logAuditEvent({ action: "admin_gdpr_export", entityType: "user", entityId: selectedUser.user_id, details: `GDPR data export for ${selectedUser.email}` });
      toast.success("User data exported and downloaded");
    } catch (err: any) {
      toast.error("Export failed: " + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("admin-gdpr", {
        body: { action: "delete", user_id: selectedUser.user_id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message);

      logAuditEvent({ action: "admin_gdpr_delete", entityType: "user", entityId: selectedUser.user_id, userEmail: selectedUser.email, details: `All user data permanently deleted (GDPR request) for ${selectedUser.email}` });
      toast.success("All user data permanently deleted");
      setSelectedUser(null);
      setExportPreview(null);
      setSearchResults((prev) => prev.filter((u) => u.user_id !== selectedUser.user_id));
    } catch (err: any) {
      toast.error("Deletion failed: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> GDPR Data Management
        </h2>
        <p className="text-sm text-muted-foreground">Export or permanently delete all data for a specific user</p>
      </div>

      {/* Search */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Find User</CardTitle>
          <CardDescription className="text-xs">Search by email or user ID to manage their data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Email address..." className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchUser()} />
            </div>
            <Input placeholder="Or user ID..." className="sm:w-[280px]" value={userId} onChange={(e) => setUserId(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchUser()} />
            <Button onClick={searchUser} disabled={searching} variant="outline">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-1">Search</span>
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.user_id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUser?.user_id === user.user_id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedUser({ user_id: user.user_id, email: user.email || "Unknown" })}
                >
                  <div>
                    <p className="text-sm font-medium">{user.email || "No email"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{user.user_id}</p>
                    {user.full_name && <p className="text-xs text-muted-foreground">{user.full_name}</p>}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      {selectedUser && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Data Actions for {selectedUser.email}</CardTitle>
            <CardDescription className="text-xs font-mono">{selectedUser.user_id}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Export */}
              <div className="p-4 rounded-lg border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  <h3 className="font-medium text-sm">Export Data</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Download a complete JSON export of all user data including profile, documents, financial records, and activity history.
                </p>
                <Button onClick={handleExport} disabled={exporting} className="w-full" variant="outline">
                  {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Export All Data
                </Button>
              </div>

              {/* Delete */}
              <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-destructive" />
                  <h3 className="font-medium text-sm">Delete All Data</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Permanently delete all user data, storage files, and auth account. This action cannot be undone.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full" disabled={deleting}>
                      {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Delete All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" /> Permanent Data Deletion
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>This will permanently delete ALL data for <strong>{selectedUser.email}</strong>:</p>
                        <ul className="list-disc list-inside text-xs space-y-1 mt-2">
                          <li>Profile and account settings</li>
                          <li>All documents and uploaded files</li>
                          <li>Expense and income records</li>
                          <li>Export history and notifications</li>
                          <li>Category rules and categories</li>
                          <li>Organization data</li>
                          <li>Authentication account</li>
                        </ul>
                        <p className="font-semibold mt-3">This action cannot be undone. We recommend exporting data first.</p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Yes, permanently delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Preview */}
      {exportPreview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Export Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(exportPreview.summary || {}).map(([key, val]) => (
                <div key={key} className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-lg font-bold">{String(val)}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(exportPreview).filter(([k]) => Array.isArray(exportPreview[k])).map(([key, val]) => (
                <Badge key={key} variant="secondary" className="text-[10px]">
                  {key}: {(val as any[]).length} records
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
