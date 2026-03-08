import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CreditCard, CheckCircle2, Clock, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function BillingSection() {
  const sub = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

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
                <h3 className="font-semibold">
                  {sub.plan === "pro" ? "Pro" : "Free"} Plan
                </h3>
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

      {/* Upgrade section for free users */}
      {!sub.subscribed && (
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold mb-1">Upgrade to Pro</h3>
            <p className="text-sm text-muted-foreground mb-4">Get unlimited documents, team access, email import, and more. Start with a 14-day free trial.</p>
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
                €9.99/month — Start Trial
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
