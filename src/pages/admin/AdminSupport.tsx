import { useState } from "react";
import { adminOrganizations, adminUsers, adminDocuments } from "@/lib/admin-mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Building2, Users, FileText, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminSupportPage() {
  const [search, setSearch] = useState("");

  const matchedOrgs = adminOrganizations.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.owner.toLowerCase().includes(search.toLowerCase()) ||
    o.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOrg = search.length > 0 ? matchedOrgs[0] : null;
  const orgUsers = selectedOrg ? adminUsers.filter((u) => u.organizationId === selectedOrg.id) : [];
  const orgDocs = selectedOrg ? adminDocuments.filter((d) => d.organization === selectedOrg.name) : [];

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
              placeholder="Search by organization name, owner, or email..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {search.length > 0 && matchedOrgs.length > 0 && (
            <div className="mt-3 space-y-2">
              {matchedOrgs.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => setSearch(org.name)}>
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{org.name}</p>
                      <p className="text-xs text-muted-foreground">{org.owner} · {org.ownerEmail}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{org.plan}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedOrg && (
        <>
          {/* Org Info */}
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
              <div className="grid sm:grid-cols-4 gap-4">
                <div><p className="text-xs text-muted-foreground">Plan</p><p className="text-sm font-medium capitalize">{selectedOrg.plan}</p></div>
                <div><p className="text-xs text-muted-foreground">Status</p><p className="text-sm font-medium capitalize">{selectedOrg.status}</p></div>
                <div><p className="text-xs text-muted-foreground">Users</p><p className="text-sm font-medium">{selectedOrg.users}</p></div>
                <div><p className="text-xs text-muted-foreground">Documents</p><p className="text-sm font-medium">{selectedOrg.documentsUploaded}</p></div>
              </div>
            </CardContent>
          </Card>

          {/* Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Users ({orgUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orgUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{u.role}</Badge>
                      <Badge variant="secondary" className="capitalize">{u.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Recent Documents ({orgDocs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {orgDocs.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{d.fileName}</p>
                      <p className="text-xs text-muted-foreground">{d.user} · {new Date(d.uploadDate).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">{d.documentType.replace('_', ' ')}</Badge>
                      <Badge variant="secondary" className="capitalize">{d.status.replace('_', ' ')}</Badge>
                    </div>
                  </div>
                ))}
                {orgDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents found</p>}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {search.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">Search for an organization to view their data and provide support.</p>
        </div>
      )}
    </div>
  );
}
