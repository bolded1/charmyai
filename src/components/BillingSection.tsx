import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CheckCircle2, Clock, Loader2, ExternalLink, Download, FileText, Shield } from "lucide-react";
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
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Pro Plan</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {sub.status === "trialing" && (
                    <Badge variant="secondary" className="bg-accent text-accent-foreground text-[10px]">
                      <Clock className="h-3 w-3 mr-1" /> Trial
                    </Badge>
                  )}
                  {sub.status === "active" && (
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
            {sub.subscribed && (
              <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ExternalLink className="h-4 w-4 mr-1" />}
                Manage Billing
              </Button>
            )}
          </div>

          {sub.subscribed && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Billing Cycle</p>
                  <p className="font-medium capitalize">{sub.billingInterval}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    {sub.status === "trialing" ? "Trial Ends" : "Next Billing"}
                  </p>
                  <p className="font-medium">
                    {sub.status === "trialing" && sub.trial_end
                      ? new Date(sub.trial_end).toLocaleDateString()
                      : sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString()
                        : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Price</p>
                  <p className="font-medium">
                    {sub.billingInterval === "yearly" ? "€99/year" : "€9.99/month"}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Payment Method</h3>
            {sub.subscribed && (
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
              {/* Header */}
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
                  <span className="text-muted-foreground text-xs truncate">
                    {inv.number || "—"}
                  </span>
                  <span className="text-right font-medium">
                    €{inv.amount.toFixed(2)}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`text-[9px] ${
                      inv.status === "paid"
                        ? "bg-primary/10 text-primary"
                        : inv.status === "open"
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {inv.status}
                  </Badge>
                  <div>
                    {inv.pdf_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => window.open(inv.pdf_url!, "_blank")}
                      >
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

      {/* Subscribe section for users without a subscription */}
      {!sub.subscribed && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-1">Subscribe to Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get unlimited documents, team access, email import, and more. Start with a 7-day free trial.
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
                onClick={() => STRIPE_PLANS.pro.price_id_monthly && handleUpgrade(STRIPE_PLANS.pro.price_id_monthly)}
                disabled={!!checkoutLoading}
              >
                {checkoutLoading === STRIPE_PLANS.pro.price_id_monthly ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                €9.99/month — Start 7-Day Trial
              </Button>
              <Button
                variant="outline"
                onClick={() => STRIPE_PLANS.pro.price_id_yearly && handleUpgrade(STRIPE_PLANS.pro.price_id_yearly)}
                disabled={!!checkoutLoading}
              >
                {checkoutLoading === STRIPE_PLANS.pro.price_id_yearly ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                €99/year — Save 17%
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
