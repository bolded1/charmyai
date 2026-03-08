import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { STRIPE_PLANS } from "@/hooks/useSubscription";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Shield, Lock, CreditCard, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const STRIPE_PK = "pk_live_51Dzp0JBmkvUKJ0fuaOO3lXgQ83A5srdQrW5qKGr4ve9yaED1A5UmEel695J4wGxsokdAznHG53i33ELPjqgCFzqV00Y3AyofY0";

export default function ActivateTrialPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const brandLogo = useBrandLogo();

  const [stripe, setStripe] = useState<any>(null);
  const [elements, setElements] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [billingName, setBillingName] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");

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

  // Create SetupIntent and mount Elements
  useEffect(() => {
    if (!stripe || !user) return;

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

    initSetup();
  }, [stripe, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;

    setSubmitting(true);
    setSetupError(null);

    try {
      // Confirm the SetupIntent
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

      // Activate trial subscription
      const priceId = billingInterval === "yearly"
        ? STRIPE_PLANS.pro.price_id_yearly
        : STRIPE_PLANS.pro.price_id_monthly;

      const { data, error } = await supabase.functions.invoke("activate-trial", {
        body: {
          priceId,
          paymentMethodId: setupIntent.payment_method,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Your 7-day free trial has been activated!");
      navigate("/app");
    } catch (err: any) {
      setSetupError(err.message || "Failed to activate trial");
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
          <h1 className="text-2xl font-bold text-foreground">Start your 7-day free trial</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            Add your payment method to begin your free trial. You will not be charged until the trial ends.
          </p>
        </div>

        <div className="glass-auth rounded-2xl p-6">
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

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {setupError && (
              <p className="text-sm text-destructive">{setupError}</p>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting || !stripe || !clientSecret}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Start Free Trial
            </Button>
          </form>

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
            Cancel anytime during your trial. No charge until the trial ends.
          </p>
          <p className="text-center text-[11px] text-muted-foreground/70 mt-1.5">
            Your card details are processed securely by Stripe and are never stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}
