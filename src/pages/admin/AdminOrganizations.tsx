import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Building2, Loader2, RefreshCw, Download, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";

interface OrgRow {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
  workspace_type?: string;
  parent_org_id?: string | null;
  owner_email?: string;
  user_count?: number;
  doc_count?: number;
}

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OrgRow | null>(null);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [orgDocs, setOrgDocs] = useState<any[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<OrgRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const isMobile = useIsMobile();

  const fetchOrgs = async () => {
    setLoading(true);
    try {
      const { data: orgsData, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const enriched = await Promise.all(
        (orgsData || []).map(async (org) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("user_id", org.owner_user_id)
            .maybeSingle();

          const { count: docCount } = await supabase
            .from("documents")
            .select("id", { count: "exact", head: true })
            .eq("user_id", org.owner_user_id);

          return {
            ...org,
            owner_email: profile?.email || "Unknown",
            user_count: 1,
            doc_count: docCount || 0,
          };
        })
      );
      setOrgs(enriched);
    } catch (err: any) {
      toast.error("Failed to load organizations: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const loadOrgDetails = async (org: OrgRow) => {
    setSelected(org);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", org.owner_user_id);
    setOrgUsers(profiles || []);

    const { data: docs } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", org.owner_user_id)
      .order("created_at", { ascending: false })
      .limit(50);
    setOrgDocs(docs || []);
  };

  const handleDeleteOrg = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-firm-management", {
        body: { action: "delete_organization", org_id: deleteTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Organization "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      setSelected(null);
      fetchOrgs();
    } catch (err: any) {
      toast.error("Failed to delete: " + (err.message || "Unknown error"));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => { fetchOrgs(); }, []);

  const filtered = orgs.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    (org.owner_email || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search organizations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          const rows = [["Name", "Owner Email", "Documents", "Created"]];
          filtered.forEach((o) => rows.push([o.name, o.owner_email || "", String(o.doc_count), new Date(o.created_at).toLocaleDateString()]));
          const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
          const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `organizations-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
          URL.revokeObjectURL(url);
        }} disabled={filtered.length === 0}>
          <Download className="h-4 w-4 mr-1" /> CSV
        </Button>
        <Button variant="outline" size="sm" onClick={fetchOrgs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {orgs.length === 0 ? "No organizations found" : "No organizations match your search"}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((org) => (
            <MobileRecordCard
              key={org.id}
              title={org.name}
              subtitle={org.owner_email || ""}
              fields={[
                { label: "Documents", value: String(org.doc_count || 0) },
                { label: "Created", value: new Date(org.created_at).toLocaleDateString() },
              ]}
              onClick={() => loadOrgDetails(org)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground">Organization</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Owner</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Documents</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Created</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org) => (
                    <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-sm font-medium">{org.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{org.owner_email}</td>
                      <td className="p-3 text-sm">{org.doc_count}</td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(org.created_at).toLocaleDateString()}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => loadOrgDetails(org)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(org)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <Tabs defaultValue="info" className="mt-2">
              <TabsList className={`grid w-full ${isMobile ? "grid-cols-2" : "grid-cols-3"}`}>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="users">Users ({orgUsers.length})</TabsTrigger>
                <TabsTrigger value="documents">Docs ({orgDocs.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: "Owner", v: selected.owner_email || "—" },
                    { l: "Created", v: new Date(selected.created_at).toLocaleDateString() },
                    { l: "Updated", v: new Date(selected.updated_at).toLocaleDateString() },
                    { l: "Documents", v: String(selected.doc_count || 0) },
                  ].map((f) => (
                    <div key={f.l}>
                      <p className="text-xs text-muted-foreground">{f.l}</p>
                      <p className="text-sm font-medium">{f.v}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <Button variant="destructive" size="sm" onClick={() => { setSelected(null); setDeleteTarget(selected); }}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete Organization
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <div className="space-y-2">
                  {orgUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{u.full_name || u.first_name || u.email || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant="secondary">Owner</Badge>
                    </div>
                  ))}
                  {orgUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No users found</p>}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-4">
                <div className="space-y-2">
                  {orgDocs.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{d.file_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{d.status}</Badge>
                    </div>
                  ))}
                  {orgDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents found</p>}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this organization and all its data including documents, expenses, income records, and categories. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteOrg} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}