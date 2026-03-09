import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard, CheckCircle2, Clock, Loader2, ExternalLink, Download,
  Building2, Briefcase, Shield, Sparkles, Tag, X, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePromoCode } from "@/hooks/usePromoCode";

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
  
  // Use actual amount paid from Stripe; fall back to list price
  const formatAmount = (amount: number, currency: string) => {
    const symbol = currency.toLowerCase() === "eur" ? "€" : currency.toLowerCase() === "usd" ? "$" : currency.toUpperCase() + " ";
    return amount === 0 ? "Free" : `${symbol}${amount.toFixed(2)}`;
  };
  const planPrice = sub.amount_paid !== null
    ? formatAmount(sub.amount_paid, sub.paid_currency)
    : sub.plan === "firm" ? "€99.00" : sub.plan === "pro" ? "€29.99" : null;

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

          {/* Pro plan details */}
          {sub.subscribed && !sub.has_firm_plan && sub.plan === "pro" && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Payment Type</p>
                  <p className="font-medium">{sub.subscription_id ? "Subscription" : "One-time"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Amount Paid</p>
                  <p className="font-medium">{planPrice}</p>
                </div>
                {sub.current_period_end && (
                  <div>
                    <p className="text-muted-foreground text-xs">Current Period End</p>
                    <p className="font-medium">{new Date(sub.current_period_end).toLocaleDateString()}</p>
                  </div>
                )}
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
                  <p className="font-medium">{planPrice}</p>
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

      {/* Firm plan upsell (show only to subscribed pro users without firm plan) */}
      {sub.subscribed && !sub.has_firm_plan && sub.plan === "pro" && (
        <FirmUpgradeCard />
      )}
    </div>
  );
}

const STRIPE_PK = "pk_live_51Dzp0JBmkvUKJ0fuaOO3lXgQ83A5srdQrW5qKGr4ve9yaED1A5UmEel695J4wGxsokdAznHG53i33ELPjqgCFzqV00Y3AyofY0";

function FirmUpgradeCard() {
  const { user } = useAuth();
  const { validateCode, clearPromo, validating, promoResult } = usePromoCode();
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [billingName, setBillingName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Stripe state
  const [stripe, setStripe] = useState<any>(null);
  const [firmElements, setFirmElements] = useState<any>(null);
  const [firmClientSecret, setFirmClientSecret] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);

  const cardRequired = !(promoResult?.valid && promoResult.requires_card === false);

  // Load Stripe.js
  useEffect(() => {
    if (document.querySelector('script[src*="js.stripe.com"]')) {
      waitForStripe();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = waitForStripe;
    document.head.appendChild(script);

    function waitForStripe() {
      const check = setInterval(() => {
        if ((window as any).Stripe) {
          clearInterval(check);
          setStripe((window as any).Stripe(STRIPE_PK));
        }
      }, 100);
    }
  }, []);

  // Create PaymentIntent and mount Elements
  useEffect(() => {
    if (!stripe || !user || !cardRequired) return;

    const init = async () => {
      try {
        const waitForEl = () => new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const check = () => {
            if (document.getElementById("stripe-firm-upgrade-element")) return resolve();
            if (++attempts > 30) return reject(new Error("Payment element not found"));
            setTimeout(check, 100);
          };
          check();
        });
        await waitForEl();

        const { data, error } = await supabase.functions.invoke("firm-payment-intent");
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setFirmClientSecret(data.client_secret);

        const els = stripe.elements({
          clientSecret: data.client_secret,
          appearance: {
            theme: "stripe",
            variables: {
              colorPrimary: "#1E3A8A",
              borderRadius: "12px",
              fontFamily: "system-ui, sans-serif",
            },
          },
        });
        setFirmElements(els);

        const pe = els.create("payment");
        pe.mount("#stripe-firm-upgrade-element");
        pe.on("ready", () => setPaymentReady(true));
      } catch (err: any) {
        setSetupError(err.message || "Failed to initialize payment form");
      }
    };

    init();
  }, [stripe, user, cardRequired]);

  const handleApplyPromo = async () => {
    await validateCode(promoCode, "onetime", "firm");
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoCode("");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSetupError(null);
    try {
      if (cardRequired) {
        if (!stripe || !firmElements || !firmClientSecret) return;
        const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
          elements: firmElements,
          confirmParams: {
            payment_method_data: {
              billing_details: { name: billingName || undefined },
            },
          },
          redirect: "if_required",
        });

        if (confirmError) {
          setSetupError(confirmError.message);
          setSubmitting(false);
          return;
        }

        if (paymentIntent?.status !== "succeeded") {
          setSetupError("Payment was not completed. Please try again.");
          setSubmitting(false);
          return;
        }
      } else {
        const { data, error } = await supabase.functions.invoke("activate-trial", {
          body: {
            priceId: STRIPE_PLANS.firm.price_id,
            skipCard: true,
            promoCodeId: promoResult?.valid ? promoResult.promo_code_id : undefined,
            stripeCouponId: promoResult?.valid ? promoResult.stripe_coupon_id : undefined,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      if (user) {
        try {
          await supabase
            .from("profiles")
            .update({ billing_setup_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } catch {}
      }

      toast.success("Payment successful! Your firm plan is now active.");
      window.location.reload();
    } catch (err: any) {
      setSetupError(err.message || "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Price calculation
  const basePrice: number = STRIPE_PLANS.firm.price_onetime || 99;
  let finalPrice: number = basePrice;
  let discountLine: string | null = null;
  if (promoResult?.valid) {
    if (promoResult.discount_type === "percentage" && promoResult.discount_value) {
      finalPrice = basePrice * (1 - promoResult.discount_value / 100);
      discountLine = promoResult.discount_value === 100 ? "Free" : `-${promoResult.discount_value}%`;
    } else if (promoResult.discount_type === "fixed" && promoResult.discount_value) {
      finalPrice = Math.max(0, basePrice - promoResult.discount_value);
      discountLine = `-€${promoResult.discount_value}`;
    } else if (promoResult.discount_type === "free_period") {
      finalPrice = 0;
      discountLine = "Free";
    }
  }

  return (
    <Card className="border-primary/20 bg-card">
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

        {/* Promo Code */}
        <div className="mb-5">
          {!promoExpanded && !promoResult?.valid ? (
            <button
              type="button"
              onClick={() => setPromoExpanded(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
            >
              <Tag className="h-3.5 w-3.5" />
              Have a promo code?
            </button>
          ) : promoResult?.valid ? (
            <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary">{promoResult.discount_label}</p>
                  <p className="text-xs text-muted-foreground">Code: {promoCode.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={handleRemovePromo} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div>
              <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mb-1.5">
                <Tag className="h-3 w-3" /> Promo Code
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="h-9 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                />
                <Button variant="outline" size="sm" className="h-9" onClick={handleApplyPromo} disabled={!promoCode.trim() || validating}>
                  {validating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Billing summary */}
        <div className="rounded-xl border border-border/50 bg-muted/30 p-3 mb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Firm Plan (one-time)</span>
            <span className="font-medium">€{basePrice.toFixed(2)}</span>
          </div>
          {discountLine && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-primary">Discount</span>
              <span className="text-primary font-medium">{discountLine}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex items-center justify-between text-sm font-semibold">
            <span>Total</span>
            <span>€{finalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Billing name */}
        {cardRequired && (
          <div className="mb-4">
            <Label htmlFor="firm-billing-name" className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Name on Card
            </Label>
            <Input
              id="firm-billing-name"
              placeholder="Full name"
              value={billingName}
              onChange={(e) => setBillingName(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
        )}

        {/* Stripe Payment Element */}
        {cardRequired && (
          <div className="mb-5">
            <Label className="text-xs font-medium text-muted-foreground mb-1.5 block">Payment Details</Label>
            <div
              id="stripe-firm-upgrade-element"
              className="min-h-[120px] rounded-xl border border-border/50 bg-card p-3"
            />
            {!paymentReady && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
                <Loader2 className="h-3 w-3 animate-spin" /> Loading payment form...
              </div>
            )}
          </div>
        )}

        {setupError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {setupError}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={submitting || (cardRequired && (!paymentReady || !firmClientSecret))}
          className="w-full"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          {finalPrice === 0 ? "Activate Firm Plan" : `Pay €${finalPrice.toFixed(2)} — Upgrade to Firm Plan`}
        </Button>

        <p className="text-[10px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
          <Shield className="h-3 w-3" /> Secured by Stripe · One-time payment
        </p>
      </CardContent>
    </Card>
  );
}
