import { useState } from "react";
import { adminOrganizations } from "@/lib/admin-mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, RefreshCw, Ban, XCircle } from "lucide-react";
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

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const isMobile = useIsMobile();

  const filtered = adminOrganizations.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase());
    const matchesPlan = planFilter === "all" || org.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const getSubActions = (org: typeof adminOrganizations[0]) => [
    { label: "Change Plan", icon: <RefreshCw className="h-3.5 w-3.5" />, onClick: () => toast.success(`Plan changed for ${org.name}`) },
    { label: "Suspend", icon: <Ban className="h-3.5 w-3.5" />, onClick: () => toast.info(`${org.name} subscription suspended`) },
    { label: "Cancel", icon: <XCircle className="h-3.5 w-3.5" />, onClick: () => toast.error(`${org.name} subscription cancelled`), destructive: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search subscriptions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
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
              subtitle={`${org.billingCycle} billing`}
              badge={{ label: org.status, className: statusColors[org.status] }}
              fields={[
                { label: "Plan", value: org.plan },
                { label: "Next Billing", value: org.nextBillingDate },
              ]}
              actions={<OverflowActions actions={getSubActions(org)} />}
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">Plan</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Billing Cycle</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Next Billing</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((org) => (
                    <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium">{org.name}</td>
                      <td className="p-3"><Badge variant="secondary" className={`capitalize ${planColors[org.plan]}`}>{org.plan}</Badge></td>
                      <td className="p-3"><Badge variant="secondary" className={`capitalize ${statusColors[org.status]}`}>{org.status}</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground capitalize">{org.billingCycle}</td>
                      <td className="p-3 text-sm text-muted-foreground">{org.nextBillingDate}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success(`Plan changed for ${org.name}`)}>
                            <RefreshCw className="h-3 w-3 mr-1" /> Change
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.info(`${org.name} subscription suspended`)}>
                            <Ban className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => toast.error(`${org.name} subscription cancelled`)}>
                            <XCircle className="h-3.5 w-3.5" />
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
    </div>
  );
}
