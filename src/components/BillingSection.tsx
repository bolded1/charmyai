import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard, CheckCircle2, Clock, Loader2, ExternalLink, Download,
  Building2, Briefcase, Shield, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
}

interface Invoice {
  id: string;
  number: string | null;
  date: string | null;
  amount: number;
  currency: string;
  status: string;
  pdf_url: string | null;
  hosted_url: string | null;
}

interface BillingDetails {
  payment_method: PaymentMethod | null;
  invoices: Invoice[];
  billing_email: string;
}

export default function BillingSection() {
  const sub = useSubscription();
  const { isAccountingFirm, clientWorkspaces, allWorkspaces } = useWorkspace();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

  const homeOrg = allWorkspaces.find(
    (w) => w.workspace_type === "accounting_firm" || w.workspace_type === "standard"
  );
  const maxWorkspaces = homeOrg?.max_client_workspaces || 10;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("billing-details");
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setBillingDetails(data);
      } catch (err) {
        console.error("Failed to fetch billing details:", err);
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [sub.subscribed]);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      await sub.openCustomerPortal();
    } catch (err: any) {
      toast.error(err.message || "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleUpgrade = async (priceId: string) => {
    setCheckoutLoading(priceId);
    try {
      await sub.startCheckout(priceId);
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (sub.loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const brandLabel = (brand: string) => {
    const map: Record<string, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" };
    return map[brand] || brand.charAt(0).toUpperCase() + brand.slice(1);
  };

  const planName = sub.plan === "firm" ? "Accounting Firm" : sub.plan === "pro" ? "Pro" : "Free";
  const planPrice = sub.plan === "firm" ? "€99.00" : sub.plan === "pro" ? "€29.99" : null;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${sub.has_firm_plan ? "bg-primary/10" : "bg-primary/10"}`}>
                {sub.has_firm_plan ? <Building2 className="h-5 w-5 text-primary" /> : <CreditCard className="h-5 w-5 text-primary" />}
              </div>
              <div>
                <h3 className="font-semibold">{planName} Plan</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {sub.has_firm_plan && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                      <Shield className="h-3 w-3 mr-1" /> Lifetime Access
                    </Badge>
                  )}
                  {!sub.has_firm_plan && sub.plan === "pro" && sub.status === "active" && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                    </Badge>
                  )}
                  {sub.cancel_at_period_end && (
                    <Badge variant="secondary" className="bg-destructive/10 text-destructive text-[10px]">
                      Cancels at period end
                    </Badge>
                  )}
                  {!sub.subscribed && (
                    <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">
                      No active plan
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {sub.subscribed && !sub.has_firm_plan && (
              <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
                Manage Billing
              </Button>
            )}
          </div>

          {/* Pro plan details (one-time) */}
          {sub.subscribed && !sub.has_firm_plan && sub.plan === "pro" && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Payment Type</p>
                  <p className="font-medium">One-time</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount Paid</p>
                  <p className="font-medium">{planPrice}</p>
                </div>
              </div>
            </>
          )}

          {/* Firm plan details */}
          {sub.has_firm_plan && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Payment Type</p>
                  <p className="font-medium">One-time</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount Paid</p>
                  <p className="font-medium">€99.00</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Access</p>
                  <p className="font-medium">Lifetime</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Workspace Usage (firm plan only) */}
      {sub.has_firm_plan && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Workspace Usage</h3>
                <p className="text-xs text-muted-foreground">
                  {clientWorkspaces.length} of {maxWorkspaces} client workspaces used
                </p>
              </div>
            </div>
            <Progress value={(clientWorkspaces.length / maxWorkspaces) * 100} className="h-2 mb-3" />
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {Array.from({ length: maxWorkspaces }).map((_, i) => (
                <div
                  key={i}
                  className={`h-5 rounded-md transition-colors ${
                    i < clientWorkspaces.length ? "bg-primary/80" : "bg-accent border border-border/60"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{clientWorkspaces.length} active</span>
              <span>{maxWorkspaces - clientWorkspaces.length} remaining</span>
            </div>

            {/* Entitlements list */}
            <Separator className="my-4" />
            <p className="text-xs font-medium text-muted-foreground mb-2">Plan Entitlements</p>
            <ul className="space-y-1.5">
              {STRIPE_PLANS.firm.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Payment Method */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Payment Method</h3>
            {sub.subscribed && !sub.has_firm_plan && (
              <Button variant="ghost" size="sm" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Update"}
              </Button>
            )}
          </div>
          {detailsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
            </div>
          ) : billingDetails?.payment_method ? (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="h-9 w-14 rounded bg-card border border-border flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">
                  {brandLabel(billingDetails.payment_method.brand)} •••• {billingDetails.payment_method.last4}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expires {billingDetails.payment_method.exp_month.toString().padStart(2, "0")}/{billingDetails.payment_method.exp_year}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No payment method on file.</p>
          )}
          {billingDetails?.billing_email && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground">Billing Email</p>
              <p className="text-sm font-medium">{billingDetails.billing_email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-4">Billing History</h3>
          {detailsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading...
            </div>
          ) : billingDetails?.invoices && billingDetails.invoices.length > 0 ? (
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_80px_80px_60px_40px] gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-2">
                <span>Date</span>
                <span>Invoice</span>
                <span className="text-right">Amount</span>
                <span>Status</span>
                <span></span>
              </div>
              {billingDetails.invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="grid grid-cols-[1fr_80px_80px_60px_40px] gap-2 items-center text-sm px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className="text-foreground">
                    {inv.date ? new Date(inv.date).toLocaleDateString() : "—"}
                  </span>
                  <span className="text-muted-foreground text-xs truncate">{inv.number || "—"}</span>
                  <span className="text-right font-medium">€{inv.amount.toFixed(2)}</span>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] ${
                      inv.status === "paid" ? "bg-primary/10 text-primary"
                        : inv.status === "open" ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {inv.status}
                  </Badge>
                  <div>
                    {inv.pdf_url && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(inv.pdf_url!, "_blank")}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Subscribe section */}
      {!sub.subscribed && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-1">Get Charmy Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get unlimited documents, team access, email import, and more. One-time payment — lifetime access.
            </p>
            <ul className="space-y-2 mb-6">
              {STRIPE_PLANS.pro.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleUpgrade(STRIPE_PLANS.pro.price_id)}
                disabled={!!checkoutLoading}
              >
                {checkoutLoading === STRIPE_PLANS.pro.price_id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                €29.99 — Get Lifetime Access
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Firm plan upsell (show only to subscribed non-firm users) */}
      {sub.subscribed && !sub.has_firm_plan && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Accounting Firm Plan</h3>
                <p className="text-xs text-muted-foreground">One-time payment · Lifetime access</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Manage up to 10 separate client workspaces from one account. Perfect for accountants and bookkeepers.
            </p>
            <ul className="space-y-1.5 mb-5">
              {STRIPE_PLANS.firm.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => handleUpgrade(STRIPE_PLANS.firm.price_id)}
              disabled={!!checkoutLoading}
            >
              {checkoutLoading === STRIPE_PLANS.firm.price_id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              €99 One-Time — Upgrade to Firm Plan
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
