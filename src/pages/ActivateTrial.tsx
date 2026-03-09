import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { STRIPE_PLANS } from "@/hooks/useSubscription";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { usePromoCode } from "@/hooks/usePromoCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Shield, Lock, CreditCard, Loader2, CheckCircle2, Tag, X, Building2, Briefcase } from "lucide-react";
import { toast } from "sonner";

const STRIPE_PK = "pk_live_51Dzp0JBmkvUKJ0fuaOO3lXgQ83A5srdQrW5qKGr4ve9yaED1A5UmEel695J4wGxsokdAznHG53i33ELPjqgCFzqV00Y3AyofY0";

type PlanChoice = "pro" | "firm";

export default function ActivateTrialPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const brandLogo = useBrandLogo();
  const { validateCode, clearPromo, validating, promoResult } = usePromoCode();

  const initialPlan = searchParams.get("plan") === "firm" ? "firm" : "pro";
  const [planChoice, setPlanChoice] = useState<PlanChoice>(initialPlan);
  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [billingName, setBillingName] = useState(
    profile ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim() : ""
  );
  const [billingAddress, setBillingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);

  // Pre-fill billing name when profile loads
  useEffect(() => {
    if (profile && !billingName) {
      const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      if (name) setBillingName(name);
    }
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    const checkExisting = async () => {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("billing_setup_at")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData?.billing_setup_at) {
          const { data, error } = await supabase.functions.invoke("check-subscription");
          if (!error && data?.subscribed) {
            setAlreadySubscribed(true);
            navigate("/app", { replace: true });
          }
        }
      } catch {
        // fail-closed
      }
    };
    checkExisting();
  }, [user, navigate]);

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
          const s = (window as any).Stripe(STRIPE_PK);
          setStripe(s);
        }
      }, 100);
    }
  }, []);

  // Firm plan: PaymentIntent client secret
  const [firmClientSecret, setFirmClientSecret] = useState<string | null>(null);
  const [firmElements, setFirmElements] = useState<any>(null);

  // Create SetupIntent and mount Elements (only for Pro plan)
  useEffect(() => {
    if (!stripe || !user || planChoice !== "pro") return;

    const initSetup = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("setup-intent");
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setClientSecret(data.client_secret);

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
        setElements(els);

        const card = els.create("payment");
        card.mount("#stripe-card-element");
        setCardElement(card);
      } catch (err: any) {
        setSetupError(err.message || "Failed to initialize payment form");
      }
    };

    const timer = setTimeout(initSetup, 100);
    return () => clearTimeout(timer);
  }, [stripe, user, planChoice]);

  // Create PaymentIntent and mount Elements for Firm plan
  useEffect(() => {
    if (!stripe || !user || planChoice !== "firm") return;

    const initFirmPayment = async () => {
      try {
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
        pe.mount("#stripe-firm-element");
      } catch (err: any) {
        setSetupError(err.message || "Failed to initialize payment form");
      }
    };

    const timer = setTimeout(initFirmPayment, 100);
    return () => clearTimeout(timer);
  }, [stripe, user, planChoice]);

  const handleApplyPromo = async () => {
    await validateCode(promoCode, billingInterval, "pro");
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoCode("");
  };

  // Re-validate when billing interval changes if code is applied
  useEffect(() => {
    if (promoResult?.valid && promoCode) {
      validateCode(promoCode, billingInterval, "pro");
    }
  }, [billingInterval]);

  // Whether card is needed based on promo (only relevant for Pro plan)
  const cardRequired = !(promoResult?.valid && promoResult.requires_card === false);

  // Handle Firm Plan inline payment
  const handleFirmCheckout = async () => {
    if (!stripe || !firmElements || !firmClientSecret) return;
    setSubmitting(true);
    setSetupError(null);
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements: firmElements,
        confirmParams: {
          payment_method_data: {
            billing_details: {
              name: billingName || undefined,
            },
          },
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setSetupError(confirmError.message);
        setSubmitting(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        // Set billing_setup_at
        if (user) {
          try {
            await supabase
              .from("profiles")
              .update({ billing_setup_at: new Date().toISOString() })
              .eq("user_id", user.id);
          } catch {}
        }

        toast.success("Payment successful! Your firm plan is now active.");
        navigate("/app/workspaces");
      } else {
        setSetupError("Payment was not completed. Please try again.");
      }
    } catch (err: any) {
      setSetupError(err.message || "Payment failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (planChoice === "firm") {
      await handleFirmCheckout();
      return;
    }

    setSubmitting(true);
    setSetupError(null);

    try {
      const priceId = billingInterval === "yearly"
        ? STRIPE_PLANS.pro.price_id_yearly
        : STRIPE_PLANS.pro.price_id_monthly;

      if (cardRequired) {
        if (!stripe || !elements || !clientSecret) return;

        const { error: confirmError, setupIntent } = await stripe.confirmSetup({
          elements,
          confirmParams: {
            payment_method_data: {
              billing_details: {
                name: billingName || undefined,
                address: billingAddress ? { line1: billingAddress } : undefined,
              },
            },
          },
          redirect: "if_required",
        });

        if (confirmError) {
          setSetupError(confirmError.message);
          setSubmitting(false);
          return;
        }

        if (!setupIntent?.payment_method) {
          setSetupError("Failed to collect payment method");
          setSubmitting(false);
          return;
        }

        const { data, error } = await supabase.functions.invoke("activate-trial", {
          body: {
            priceId,
            paymentMethodId: setupIntent.payment_method,
            promoCodeId: promoResult?.valid ? promoResult.promo_code_id : undefined,
            stripeCouponId: promoResult?.valid ? promoResult.stripe_coupon_id : undefined,
            extraTrialDays: promoResult?.valid ? promoResult.extra_trial_days : undefined,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      } else {
        const { data, error } = await supabase.functions.invoke("activate-trial", {
          body: {
            priceId,
            skipCard: true,
            promoCodeId: promoResult?.valid ? promoResult.promo_code_id : undefined,
            stripeCouponId: promoResult?.valid ? promoResult.stripe_coupon_id : undefined,
            extraTrialDays: promoResult?.valid ? promoResult.extra_trial_days : undefined,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      }

      try {
        await supabase
          .from("profiles")
          .update({ billing_setup_at: new Date().toISOString() })
          .eq("user_id", user!.id);
      } catch {}

      toast.success("Your Pro plan has been activated!");
      navigate("/app");
    } catch (err: any) {
      setSetupError(err.message || "Failed to activate plan");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  // Calculate billing summary for Pro
  const basePrice = STRIPE_PLANS.pro.price_onetime;
  let discountedPrice: number = basePrice;
  let discountLine: string | null = null;

  if (promoResult?.valid) {
    const { discount_type, discount_value, free_duration_months } = promoResult;

    if (discount_type === "percentage" && discount_value) {
      discountedPrice = basePrice * (1 - discount_value / 100);
      discountLine = `-${discount_value}%`;
      if (discount_value === 100) {
        discountLine = "Free";
      }
    } else if (discount_type === "fixed" && discount_value) {
      discountedPrice = Math.max(0, basePrice - discount_value);
      discountLine = `-€${discount_value}`;
    } else if (discount_type === "free_period" && free_duration_months) {
      discountedPrice = 0;
      discountLine = `Free`;
    }
  }

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
      <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 font-bold text-xl mb-6">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain" />
            ) : (
              <>
                <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-gradient text-2xl">Charmy</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {planChoice === "firm" ? "Get the Accounting Firm Plan" : "Get Charmy Pro"}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {planChoice === "firm"
              ? "One-time payment of €99. Manage up to 10 client workspaces — no recurring fees."
              : "One-time payment of €29.99. Get lifetime access to all Pro features."}
          </p>
        </div>

        <div className="glass-auth rounded-2xl p-6">
          {/* Plan selector */}
          <div className="flex gap-3 mb-6">
            <button
              type="button"
              onClick={() => setPlanChoice("pro")}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                planChoice === "pro"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <CreditCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Pro Plan</span>
              </div>
              <p className="text-xs text-muted-foreground">€9.99/mo · 7-day free trial</p>
            </button>
            <button
              type="button"
              onClick={() => setPlanChoice("firm")}
              className={`flex-1 rounded-xl border-2 p-4 text-left transition-all ${
                planChoice === "firm"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Accounting Firm</span>
              </div>
              <p className="text-xs text-muted-foreground">€99 one-time · 10 workspaces</p>
            </button>
          </div>

          {planChoice === "pro" ? (
            <>
              {/* Billing interval toggle */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    billingInterval === "monthly"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly — €9.99/mo
                </button>
                <button
                  type="button"
                  onClick={() => setBillingInterval("yearly")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    billingInterval === "yearly"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Yearly — €99/yr
                  <span className="absolute -top-2 -right-2 text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-bold">
                    SAVE 17%
                  </span>
                </button>
              </div>

              {/* Features list */}
              <div className="mb-6 space-y-2">
                {STRIPE_PLANS.pro.features.slice(0, 4).map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Promo code section */}
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
                ) : (
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      Promo Code
                    </Label>
                    {promoResult?.valid ? (
                      <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-primary">{promoResult.discount_label}</p>
                            <p className="text-xs text-muted-foreground">Code: {promoCode.toUpperCase()}</p>
                          </div>
                        </div>
                        <button onClick={handleRemovePromo} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="font-mono text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromo}
                          disabled={validating || !promoCode.trim()}
                          className="shrink-0"
                        >
                          {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                    )}
                    {promoResult && !promoResult.valid && promoResult.error && (
                      <p className="text-xs text-destructive">{promoResult.error}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Billing Summary */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 mb-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">Pro</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-medium">€{basePrice}{basePeriod}</span>
                </div>
                {discountLine && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-semibold text-primary">{discountLine}</span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-2 mt-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Today</span>
                  <span className="font-bold">€0 (trial)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After {trialDays}-day trial</span>
                  <span className="font-bold">€{discountedPrice.toFixed(2)}{basePeriod}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {cardRequired && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Billing Name</Label>
                      <Input
                        placeholder="John Smith"
                        value={billingName}
                        onChange={(e) => setBillingName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Billing Address (optional)</Label>
                      <Input
                        placeholder="123 Main St, Berlin"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Card Details</Label>
                      <div
                        id="stripe-card-element"
                        className="rounded-xl border border-input bg-card/80 px-3 py-3 min-h-[44px]"
                      />
                    </div>
                  </>
                )}

                {!cardRequired && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
                    <CheckCircle2 className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">No payment method required</p>
                    <p className="text-xs text-muted-foreground mt-1">Your promo code grants free access — no card needed.</p>
                  </div>
                )}

                {setupError && (
                  <p className="text-sm text-destructive">{setupError}</p>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={submitting || (cardRequired && (!stripe || !clientSecret))}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : cardRequired ? (
                    <CreditCard className="h-4 w-4 mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {cardRequired ? "Start Free Trial" : "Activate Free Access"}
                </Button>
              </form>
            </>
          ) : (
            /* ── Firm Plan ── */
            <div className="space-y-5">
              {/* Firm features */}
              <div className="space-y-2">
                {STRIPE_PLANS.firm.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                    {f}
                  </div>
                ))}
              </div>

              {/* Billing Summary */}
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium">Accounting Firm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">One-time payment</span>
                </div>
                <div className="border-t border-border/50 pt-2 mt-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-lg">€{STRIPE_PLANS.firm.price_onetime}</span>
                </div>
              </div>

              {/* Billing Name */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Billing Name</Label>
                <Input
                  placeholder="John Smith"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                />
              </div>

              {/* Inline Stripe Payment Element */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">Payment Details</Label>
                <div
                  id="stripe-firm-element"
                  className="rounded-xl border border-input bg-card/80 px-3 py-3 min-h-[44px]"
                />
              </div>

              {setupError && (
                <p className="text-sm text-destructive">{setupError}</p>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleFirmCheckout}
                disabled={submitting || !stripe || !firmClientSecret}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Building2 className="h-4 w-4 mr-2" />
                )}
                Pay €{STRIPE_PLANS.firm.price_onetime} — Get Lifetime Access
              </Button>
            </div>
          )}

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-4 mt-5 pt-4 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" />
              Secure Payment
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              256-bit Encryption
            </div>
          </div>
          <p className="text-center text-[11px] text-muted-foreground/70 mt-3">
            {planChoice === "firm"
              ? "Pay once, use forever. No recurring fees. Powered by Stripe."
              : "Cancel anytime during your trial. No charge until the trial ends."}
          </p>
          <p className="text-center text-[11px] text-muted-foreground/70 mt-1.5">
            Your card details are processed securely by Stripe and are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
