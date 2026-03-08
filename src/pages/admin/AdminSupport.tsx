import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Users, FileText, ExternalLink, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

interface OrgResult {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
  owner_email?: string;
}

export default function AdminSupportPage() {
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<OrgResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgResult | null>(null);
  const [orgUsers, setOrgUsers] = useState<any[]>([]);
  const [orgDocs, setOrgDocs] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Search orgs as user types
  useEffect(() => {
    if (search.length < 2) { setOrgs([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data: orgsData } = await supabase
        .from("organizations")
        .select("*")
        .ilike("name", `%${search}%`)
        .limit(10);

      // Enrich with owner email
      const enriched = await Promise.all(
        (orgsData || []).map(async (org) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("user_id", org.owner_user_id)
            .maybeSingle();
          return { ...org, owner_email: profile?.email || "Unknown" };
        })
      );
      setOrgs(enriched);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const selectOrg = async (org: OrgResult) => {
    setSelectedOrg(org);
    setDetailLoading(true);

    const [profilesRes, docsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", org.owner_user_id),
      supabase.from("documents").select("*").eq("user_id", org.owner_user_id).order("created_at", { ascending: false }).limit(20),
    ]);

    setOrgUsers(profilesRes.data || []);
    setOrgDocs(docsRes.data || []);
    setDetailLoading(false);
  };

  const statusColors: Record<string, string> = {
    processing: "bg-muted text-muted-foreground",
    processed: "bg-accent text-accent-foreground",
    approved: "bg-primary/10 text-primary",
    failed: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by organization name..."
              className="pl-9"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedOrg(null); }}
            />
          </div>

          {loading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && search.length >= 2 && orgs.length > 0 && !selectedOrg && (
            <div className="mt-3 space-y-2">
              {orgs.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => selectOrg(org)}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.owner_email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && search.length >= 2 && orgs.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No organizations found</p>
          )}
        </CardContent>
      </Card>

      {selectedOrg && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> {selectedOrg.name}
                </CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/organizations"><ExternalLink className="h-3 w-3 mr-1" /> View Full</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-3 gap-4">
                <div><p className="text-xs text-muted-foreground">Owner</p><p className="text-sm font-medium">{selectedOrg.owner_email}</p></div>
                <div><p className="text-xs text-muted-foreground">Created</p><p className="text-sm font-medium">{new Date(selectedOrg.created_at).toLocaleDateString()}</p></div>
                <div><p className="text-xs text-muted-foreground">Documents</p><p className="text-sm font-medium">{orgDocs.length}</p></div>
              </div>
            </CardContent>
          </Card>

          {detailLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Users ({orgUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orgUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{u.full_name || u.first_name || u.email || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                        <Badge variant="secondary" className="capitalize">{u.status || "active"}</Badge>
                      </div>
                    ))}
                    {orgUsers.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No users found</p>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Recent Documents ({orgDocs.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {orgDocs.map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{d.file_name}</p>
                          <p className="text-xs text-muted-foreground">{d.supplier_name || "—"} · {new Date(d.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="capitalize">{(d.document_type || "—").replace("_", " ")}</Badge>
                          <Badge variant="secondary" className={`capitalize ${statusColors[d.status] || ""}`}>{d.status}</Badge>
                        </div>
                      </div>
                    ))}
                    {orgDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents found</p>}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {search.length < 2 && !selectedOrg && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Search for an organization to view their data and provide support.</p>
        </div>
      )}
    </div>
  );
}
