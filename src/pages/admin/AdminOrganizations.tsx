import { useState } from "react";
import { adminOrganizations, adminUsers, adminDocuments } from "@/lib/admin-mock-data";
import type { AdminOrganization } from "@/lib/admin-mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Eye, Ban, Trash2, Building2, Users, FileText, CreditCard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { OverflowActions } from "@/components/ui/overflow-actions";
import { toast } from "sonner";

const planColors: Record<string, string> = {
  starter: "bg-secondary text-secondary-foreground",
  professional: "bg-primary/10 text-primary",
  enterprise: "bg-accent text-accent-foreground",
};

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  suspended: "bg-destructive/10 text-destructive",
  trial: "bg-accent text-accent-foreground",
};

export default function AdminOrganizations() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [selected, setSelected] = useState<AdminOrganization | null>(null);
  const isMobile = useIsMobile();

  const filtered = adminOrganizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) || org.owner.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || org.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const orgUsers = selected ? adminUsers.filter((u) => u.organizationId === selected.id) : [];
  const orgDocs = selected ? adminDocuments.filter((d) => d.organization === selected?.name) : [];

  const getOrgActions = (org: AdminOrganization) => [
    { label: "View Details", icon: <Eye className="h-3.5 w-3.5" />, onClick: () => setSelected(org) },
    { label: org.status === "suspended" ? "Activate" : "Suspend", icon: <Ban className="h-3.5 w-3.5" />, onClick: () => toast.info(`${org.name} ${org.status === 'suspended' ? 'activated' : 'suspended'}`) },
    { label: "Delete", icon: <Trash2 className="h-3.5 w-3.5" />, onClick: () => toast.error(`${org.name} deleted`), destructive: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search organizations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={planFilter} onValueChange={setPlanFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Plans" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Plans</SelectItem>
            <SelectItem value="starter">Starter</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isMobile ? (
        <div className="space-y-2">
          {filtered.map((org) => (
            <MobileRecordCard
              key={org.id}
              title={org.name}
              subtitle={org.owner}
              badge={{ label: org.status, className: statusColors[org.status] }}
              fields={[
                { label: "Plan", value: org.plan },
                { label: "Users", value: String(org.users) },
                { label: "Documents", value: String(org.documentsUploaded) },
                { label: "Created", value: org.createdAt },
              ]}
              onClick={() => setSelected(org)}
              actions={<OverflowActions actions={getOrgActions(org)} />}
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">Plan</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Users</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Documents</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Created</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
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
                      <td className="p-3 text-sm text-muted-foreground">{org.owner}</td>
                      <td className="p-3"><Badge variant="secondary" className={`capitalize ${planColors[org.plan]}`}>{org.plan}</Badge></td>
                      <td className="p-3 text-sm">{org.users}</td>
                      <td className="p-3 text-sm">{org.documentsUploaded}</td>
                      <td className="p-3 text-sm text-muted-foreground">{org.createdAt}</td>
                      <td className="p-3"><Badge variant="secondary" className={`capitalize ${statusColors[org.status]}`}>{org.status}</Badge></td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(org)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info(`${org.name} ${org.status === 'suspended' ? 'activated' : 'suspended'}`)}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => toast.error(`${org.name} deleted`)}>
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

      {/* Organization Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> {selected?.name}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <Tabs defaultValue="info" className="mt-2">
              <TabsList className={`grid w-full ${isMobile ? "grid-cols-2" : "grid-cols-4"}`}>
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="users">Users ({orgUsers.length})</TabsTrigger>
                <TabsTrigger value="documents">Docs ({orgDocs.length})</TabsTrigger>
                <TabsTrigger value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { l: "Owner", v: selected.owner },
                    { l: "Email", v: selected.ownerEmail },
                    { l: "Country", v: selected.country },
                    { l: "VAT Number", v: selected.vatNumber || '—' },
                    { l: "Created", v: selected.createdAt },
                    { l: "Storage Used", v: `${(selected.storageUsedMB / 1024).toFixed(1)} GB` },
                  ].map((f) => (
                    <div key={f.l}>
                      <p className="text-xs text-muted-foreground">{f.l}</p>
                      <p className="text-sm font-medium">{f.v}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{selected.users}</p><p className="text-xs text-muted-foreground">Users</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{selected.documentsUploaded}</p><p className="text-xs text-muted-foreground">Uploaded</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xl font-bold">{selected.documentsProcessed}</p><p className="text-xs text-muted-foreground">Processed</p></CardContent></Card>
                </div>
              </TabsContent>

              <TabsContent value="users" className="mt-4">
                <div className="space-y-2">
                  {orgUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{u.role}</Badge>
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
                        <p className="text-sm font-medium">{d.fileName}</p>
                        <p className="text-xs text-muted-foreground">{d.user} · {new Date(d.uploadDate).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{d.status.replace('_', ' ')}</Badge>
                    </div>
                  ))}
                  {orgDocs.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No documents found</p>}
                </div>
              </TabsContent>

              <TabsContent value="billing" className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Plan</p><p className="text-sm font-medium capitalize">{selected.plan}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p><Badge variant="secondary" className={`capitalize ${statusColors[selected.status]}`}>{selected.status}</Badge></div>
                  <div><p className="text-xs text-muted-foreground">Billing Cycle</p><p className="text-sm font-medium capitalize">{selected.billingCycle}</p></div>
                  <div><p className="text-xs text-muted-foreground">Next Billing</p><p className="text-sm font-medium">{selected.nextBillingDate}</p></div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
