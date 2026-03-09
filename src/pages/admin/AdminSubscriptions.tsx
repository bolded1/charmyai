import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, RefreshCw, Ban, XCircle, Gift, CreditCard, Loader2, Clock } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { OverflowActions } from "@/components/ui/overflow-actions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { STRIPE_PLANS } from "@/hooks/useSubscription";
import { Label } from "@/components/ui/label";

interface StripeSub {
  id: string;
  status: string;
  customer_email: string;
  customer_name: string;
  customer_id: string;
  price_id: string;
  product_name: string;
  amount: number;
  currency: string;
  interval: string;
  trial_end: string | null;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created: string;
}

const statusColors: Record<string, string> = {
  active: "bg-primary/10 text-primary",
  trialing: "bg-accent text-accent-foreground",
  canceled: "bg-destructive/10 text-destructive",
  past_due: "bg-destructive/10 text-destructive",
  incomplete: "bg-secondary text-secondary-foreground",
};

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<StripeSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const isMobile = useIsMobile();

  // Dialog states
  const [changePlanDialog, setChangePlanDialog] = useState<StripeSub | null>(null);
  const [extendTrialDialog, setExtendTrialDialog] = useState<StripeSub | null>(null);
  const [grantFreeDialog, setGrantFreeDialog] = useState(false);
  const [grantFreeEmail, setGrantFreeEmail] = useState("");
  const [trialDays, setTrialDays] = useState("7");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-subscription", {
        body: { action: "list_subscriptions" },
      });
      if (error) throw error;
      setSubs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error("Failed to load subscriptions: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubs(); }, []);

  const handleAction = async (action: string, params: Record<string, any>, successMsg: string) => {
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-subscription", {
        body: { action, ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data?.message || successMsg);
      fetchSubs();
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setActionLoading(false);
      setChangePlanDialog(null);
      setExtendTrialDialog(null);
      setGrantFreeDialog(false);
      setGrantFreeEmail("");
    }
  };

  const filtered = subs.filter((s) => {
    const matchSearch = s.customer_email.toLowerCase().includes(search.toLowerCase()) ||
      s.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("en", { style: "currency", currency: currency.toUpperCase(), minimumFractionDigits: 2 }).format(amount / 100);

  const getSubActions = (sub: StripeSub) => [
    { label: "Change Plan", icon: <RefreshCw className="h-3.5 w-3.5" />, onClick: () => setChangePlanDialog(sub) },
    ...(sub.status === "trialing" ? [{ label: "Extend Trial", icon: <Clock className="h-3.5 w-3.5" />, onClick: () => setExtendTrialDialog(sub) }] : []),
    ...(sub.cancel_at_period_end ? [] : [
      { label: "Cancel at Period End", icon: <Ban className="h-3.5 w-3.5" />, onClick: () => handleAction("cancel_subscription", { subscriptionId: sub.id }, "Subscription will cancel at period end") },
    ]),
    { label: "Cancel Immediately", icon: <XCircle className="h-3.5 w-3.5" />, onClick: () => handleAction("cancel_immediately", { subscriptionId: sub.id }, "Subscription cancelled"), destructive: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by email or name..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trialing">Trialing</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchSubs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
        <Button size="sm" onClick={() => setGrantFreeDialog(true)}>
          <Gift className="h-4 w-4 mr-1" /> Grant Free Plan
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {subs.length === 0 ? "No subscriptions found in Stripe" : "No subscriptions match your filters"}
          </CardContent>
        </Card>
      ) : isMobile ? (
        <div className="space-y-2">
          {filtered.map((sub) => (
            <MobileRecordCard
              key={sub.id}
              title={sub.customer_email}
              subtitle={`${sub.product_name} · ${sub.interval}ly`}
              badge={{ label: sub.status, className: statusColors[sub.status] || "" }}
              fields={[
                { label: "Price", value: formatAmount(sub.amount, sub.currency) },
                { label: "Renewal", value: new Date(sub.current_period_end).toLocaleDateString() },
                ...(sub.trial_end ? [{ label: "Trial Ends", value: new Date(sub.trial_end).toLocaleDateString() }] : []),
              ]}
              actions={<OverflowActions actions={getSubActions(sub)} />}
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
                    <th className="p-3 text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Plan</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Price</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Cycle</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Trial</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Renewal</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="text-sm font-medium">{sub.customer_name}</div>
                        <div className="text-xs text-muted-foreground">{sub.customer_email}</div>
                      </td>
                      <td className="p-3 text-sm">{sub.product_name}</td>
                      <td className="p-3 text-sm">{formatAmount(sub.amount, sub.currency)}</td>
                      <td className="p-3 text-sm capitalize">{sub.interval}ly</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`capitalize ${statusColors[sub.status] || ""}`}>
                          {sub.status}
                          {sub.cancel_at_period_end && " (cancelling)"}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {sub.trial_end ? new Date(sub.trial_end).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(sub.current_period_end).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <OverflowActions actions={getSubActions(sub)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Plan Dialog */}
      <Dialog open={!!changePlanDialog} onOpenChange={() => setChangePlanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Change plan for {changePlanDialog?.customer_email}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 py-4">
            <Button
              variant={changePlanDialog?.price_id === STRIPE_PLANS.pro.price_id ? "default" : "outline"}
              onClick={() => changePlanDialog && handleAction("change_plan", { subscriptionId: changePlanDialog.id, newPriceId: STRIPE_PLANS.pro.price_id }, "Switched to Pro")}
              disabled={actionLoading}
            >
              Pro (€29.99 one-time)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Extend Trial Dialog */}
      <Dialog open={!!extendTrialDialog} onOpenChange={() => setExtendTrialDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Trial</DialogTitle>
            <DialogDescription>
              Extend trial for {extendTrialDialog?.customer_email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label>Additional days from today</Label>
            <Input type="number" min="1" max="365" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => extendTrialDialog && handleAction("extend_trial", { subscriptionId: extendTrialDialog.id, days: parseInt(trialDays) }, "Trial extended")}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Extend Trial
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant Free Plan Dialog */}
      <Dialog open={grantFreeDialog} onOpenChange={setGrantFreeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant Free Plan</DialogTitle>
            <DialogDescription>
              Grant free Pro access to a customer by email. This will cancel any existing subscription and create a new one with 100% discount.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label>Customer email</Label>
            <Input type="email" placeholder="user@example.com" value={grantFreeEmail} onChange={(e) => setGrantFreeEmail(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleAction("grant_free", { customerEmail: grantFreeEmail }, "Free plan granted")}
              disabled={actionLoading || !grantFreeEmail}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
              Grant Free Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
